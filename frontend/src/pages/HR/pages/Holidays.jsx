import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, X, Save, Edit2, Trash2, PartyPopper, Building2, ChevronLeft, ChevronRight, LayoutList, LayoutGrid, Filter, Eye, Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../../services/hrService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Holidays() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingHoliday, setViewingHoliday] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [viewMode, setViewMode] = useState('list');
  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showExportMenu, setShowExportMenu] = useState(false);

  const initialForm = {
    code: '',
    name: '',
    date: '',
    holiday_type: 'National',
    applicable_for: 'All Employees',
    branch_location: 'All Branches',
    is_paid: true,
    recurring: false,
    status: 'Active',
    description: '',
    from_date: '',
    to_date: '',
    number_of_days: '',
    is_restricted: false,
    remarks: ''
  };
  const [form, setForm] = useState(initialForm);

  const holidayTypes = ['National', 'Religious', 'Company', 'Regional'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    loadHolidays();
  }, [year]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await fetchHolidays();
      // Filter holidays by selected year
      const filtered = (data || []).filter(h => {
        const holidayYear = new Date(h.date).getFullYear();
        return holidayYear === year;
      });
      setHolidays(filtered);
    } catch (e) {
      console.error('Failed to load holidays:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date) {
      alert('Please fill required fields');
      return;
    }

    try {
      // Prepare data for backend
      const holidayData = { ...form };
      if (!holidayData.year) {
        holidayData.year = new Date(form.date).getFullYear();
      }

      if (editingId) {
        await updateHoliday(editingId, holidayData);
      } else {
        await createHoliday(holidayData);
      }
      loadHolidays();
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (e) {
      console.error('Failed to save holiday:', e);
      alert('Failed to save holiday');
    }
  };

  const handleEdit = (holiday) => {
    setForm({
      code: holiday.code || '',
      name: holiday.name || '',
      date: holiday.date || '',
      holiday_type: holiday.holiday_type || 'National',
      applicable_for: holiday.applicable_for || 'All Employees',
      branch_location: holiday.branch_location || 'All Branches',
      is_paid: holiday.is_paid !== undefined ? holiday.is_paid : true,
      recurring: holiday.recurring || false,
      status: holiday.status || 'Active',
      description: holiday.description || '',
      from_date: holiday.from_date || '',
      to_date: holiday.to_date || '',
      number_of_days: holiday.number_of_days || '',
      is_restricted: holiday.is_restricted || false,
      remarks: holiday.remarks || ''
    });
    setEditingId(holiday.id);
    setShowForm(true);
  };

  const handleView = (holiday) => {
    setViewingHoliday(holiday);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await deleteHoliday(id);
      loadHolidays();
    } catch (e) {
      console.error('Failed to delete holiday:', e);
      alert('Failed to delete holiday');
    }
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = !searchTerm || 
      holiday.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      holiday.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All Types' || holiday.holiday_type === filterType;
    const matchesStatus = filterStatus === 'All Status' || holiday.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const holidaysByMonth = months.map((month, idx) => ({
    month,
    holidays: filteredHolidays.filter(h => new Date(h.date).getMonth() === idx)
  })).filter(m => m.holidays.length > 0);

  const stats = {
    total: holidays.length,
    national: holidays.filter(h => h.holiday_type === 'National').length,
    festival: holidays.filter(h => h.holiday_type === 'Religious' || h.holiday_type === 'Regional' || h.holiday_type === 'Festival').length,
    upcoming: holidays.filter(h => new Date(h.date) > new Date()).length
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Holidays Report", 14, 15);
    const tableColumn = ["#", "Code", "Holiday Name", "Date", "Day", "Type", "Status"];
    const tableRows = [];

    filteredHolidays.forEach((hol, index) => {
      tableRows.push([
        index + 1,
        hol.code || '-',
        hol.name,
        formatDate(hol.date),
        getDayOfWeek(hol.date).substring(0, 3),
        hol.holiday_type || '-',
        hol.status || 'Active'
      ]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Holidays_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredHolidays.map((hol, index) => ({
      "#": index + 1,
      "Code": hol.code || '-',
      "Holiday Name": hol.name,
      "Date": formatDate(hol.date),
      "Day": getDayOfWeek(hol.date).substring(0, 3),
      "Type": hol.holiday_type || '-',
      "Status": hol.status || 'Active'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");
    XLSX.writeFile(workbook, `Holidays_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);
  const paginatedHolidays = filteredHolidays.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  };

  const isUpcoming = (dateStr) => new Date(dateStr) > new Date();
  const isPast = (dateStr) => new Date(dateStr) < new Date();

  const getTypeColor = (type) => {
    switch (type) {
      case 'National': return 'bg-orange-100 text-orange-700';
      case 'Religious': return 'bg-purple-100 text-purple-700';
      case 'Company': return 'bg-blue-100 text-blue-700';
      case 'Regional': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
      {!showForm && !showViewModal && (
        <div style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Holidays</h1>
              <p className="text-sm text-slate-500 mt-1">Manage company holiday calendar</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setShowViewModal(false); setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontSize: 14, fontWeight: 600 }}
              >
                <Plus size={16} /> Add Holiday
              </button>
            </div>
          </div>


        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: 'rgba(99,102,241,0.1)', text: '#6366f1', icon: Calendar },
            { label: 'National', value: stats.national, color: 'rgba(249,115,22,0.1)', text: '#f97316', icon: Building2 },
            { label: 'Festival', value: stats.festival, color: 'rgba(168,85,247,0.1)', text: '#a855f7', icon: PartyPopper },
            { label: 'Upcoming', value: stats.upcoming, color: 'rgba(16,185,129,0.1)', text: '#10b981', icon: Calendar },
          ].map(({ label, value, color, text, icon: Icon }) => (
            <div key={label} className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: color, color: text }}>
                <Icon size={24} />
              </div>
              <div className="stat-details">
                <h3>{label}</h3>
                <div className="value">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by Code or Holiday Name..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', height: 44 }} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              value={filterType} 
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 160 }}
            >
              <option value="All Types">All Types</option>
              <option value="National">National</option>
              <option value="Religious">Religious</option>
              <option value="Festival">Festival</option>
              <option value="Company">Company</option>
            </select>

            <select 
              value={year} 
              onChange={(e) => { setYear(parseInt(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 120 }}
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
              <option value={currentYear + 2}>{currentYear + 2}</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 160 }}
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('All Types');
                setFilterStatus('All Status');
                setYear(currentYear);
                setCurrentPage(1);
              }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 14, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
            >
              <RefreshCw size={16} /> Reset
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)} 
                style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', height: 44, padding: '0 20px', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
              >
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
        </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
                <tr>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Code</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Holiday</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Date</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Day</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Type</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Action</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedHolidays.map(holiday => (
                  <tr key={holiday.id} className={`hover:bg-slate-50 cursor-pointer group transition-colors ${isPast(holiday.date) ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{holiday.code || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">{holiday.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">{formatDate(holiday.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{getDayOfWeek(holiday.date).substring(0, 3)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(holiday.holiday_type)}`}>
                        {holiday.holiday_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: holiday.status === 'Inactive' ? '#ef4444' : '#10b981' }}></span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: holiday.status === 'Inactive' ? '#ef4444' : '#10b981' }}>{holiday.status || 'Active'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleView(holiday)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                          <Eye size={14} color="#6366f1" />
                        </button>
                        <button onClick={() => handleEdit(holiday)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                          <Edit2 size={14} color="#3b82f6" />
                        </button>
                        <button onClick={() => handleDelete(holiday.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedHolidays.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No holidays found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Showing <span style={{ fontWeight: 600, color: '#1e293b' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(currentPage * itemsPerPage, filteredHolidays.length)}</span> of <span style={{ fontWeight: 600, color: '#1e293b' }}>{filteredHolidays.length}</span> results
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
      )}

      {/* Grid View (Month View) */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {holidaysByMonth.map(({ month, holidays }) => (
            <div key={month} className="card">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
                <h3 className="text-white font-semibold">{month} {year}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {holidays.map(holiday => (
                  <div key={holiday.id} className={`p-4 flex items-center justify-between ${isPast(holiday.date) ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center">
                        <span className="text-xs text-slate-500 uppercase">{new Date(holiday.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                        <span className="text-xl font-bold text-slate-800">{new Date(holiday.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{holiday.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(holiday.holiday_type)}`}>
                            {holiday.holiday_type}
                          </span>
                          {!holiday.is_paid && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Optional</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleView(holiday)} className="btn btn-secondary">
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleEdit(holiday)} className="btn btn-secondary">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(holiday.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {holidaysByMonth.length === 0 && (
            <div className="card">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No holidays found for {year}</p>
            </div>
          )}
        </div>
      )}
        </div>
      )}
      {/* Form Inline */}
      {showForm && (
        <div style={{ padding: 24 }}>
          <div className="card" style={{ padding: 0 }}>
            {/* Form Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {editingId ? 'Edit Holiday' : 'Add Holiday'}
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X size={16} /> Close
                </button>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={16} /> {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
            <form style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Holiday Form Fields
                </legend>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Holiday Code</label>
                    <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="form-control" placeholder="HOL-001" />
                  </div>
                  <div className="form-group">
                    <label>Holiday Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-control" placeholder="Diwali" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Holiday Date <span style={{color: 'red'}}>*</span></label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Holiday Type <span style={{color: 'red'}}>*</span></label>
                    <select value={form.holiday_type} onChange={(e) => setForm({ ...form, holiday_type: e.target.value })} className="form-control">
                      <option value="National">National</option>
                      <option value="Religious">Religious</option>
                      <option value="Regional">Regional</option>
                      <option value="Company">Company</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Applicable For <span style={{color: 'red'}}>*</span></label>
                    <select value={form.applicable_for} onChange={(e) => setForm({ ...form, applicable_for: e.target.value })} className="form-control">
                      <option value="All Employees">All Employees</option>
                      <option value="Permanent Staff">Permanent Staff</option>
                      <option value="Contractors">Contractors</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Branch / Location</label>
                    <select value={form.branch_location} onChange={(e) => setForm({ ...form, branch_location: e.target.value })} className="form-control">
                      <option value="All Branches">All Branches</option>
                      <option value="Head Office">Head Office</option>
                      <option value="Factory">Factory</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status <span style={{color: 'red'}}>*</span></label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-control">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0, fontWeight: 500, color: '#1e293b' }}>
                        <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                        Paid Holiday
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0, fontWeight: 500, color: '#1e293b' }}>
                        <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                        Recurring Every Year
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="form-control" placeholder="Detailed description of the holiday..." />
                  </div>
                </div>
              </fieldset>

              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Optional Additional Fields
                </legend>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>From Date</label>
                    <input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>To Date</label>
                    <input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Number of Days</label>
                    <input type="number" value={form.number_of_days} onChange={(e) => setForm({ ...form, number_of_days: e.target.value })} className="form-control" placeholder="e.g. 2" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0, fontWeight: 500, color: '#1e293b' }}>
                      <input type="checkbox" checked={form.is_restricted} onChange={(e) => setForm({ ...form, is_restricted: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                      Restricted/Optional Holiday
                    </label>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Remarks</label>
                    <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className="form-control" placeholder="Any additional notes or remarks..." />
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}

      {/* View Inline Form */}
      {showViewModal && viewingHoliday && (
        <div style={{ padding: 24 }}>
          <div className="card" style={{ padding: 0 }}>
            {/* View Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                View Holiday
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowViewModal(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X size={16} /> Close
                </button>
                <button onClick={() => { setShowViewModal(false); handleEdit(viewingHoliday); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Edit2 size={16} /> Edit
                </button>
              </div>
            </div>
            <form style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Holiday Details
                </legend>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Holiday Code</label>
                    <input type="text" value={viewingHoliday.code || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Holiday Name</label>
                    <input type="text" value={viewingHoliday.name || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Holiday Date</label>
                    <input type="date" value={viewingHoliday.date || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Holiday Type</label>
                    <input type="text" value={viewingHoliday.holiday_type || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Applicable For</label>
                    <input type="text" value={viewingHoliday.applicable_for || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Branch / Location</label>
                    <input type="text" value={viewingHoliday.branch_location || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <input type="text" value={viewingHoliday.status || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontWeight: 500, color: '#1e293b' }}>
                        <input type="checkbox" checked={viewingHoliday.is_paid !== undefined ? viewingHoliday.is_paid : true} disabled style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                        Paid Holiday
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontWeight: 500, color: '#1e293b' }}>
                        <input type="checkbox" checked={viewingHoliday.recurring || false} disabled style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                        Recurring Every Year
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea value={viewingHoliday.description || ''} disabled rows={2} className="form-control" />
                  </div>
                </div>
              </fieldset>

              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Optional Additional Fields
                </legend>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>From Date</label>
                    <input type="date" value={viewingHoliday.from_date || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>To Date</label>
                    <input type="date" value={viewingHoliday.to_date || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Number of Days</label>
                    <input type="text" value={viewingHoliday.number_of_days || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontWeight: 500, color: '#1e293b' }}>
                      <input type="checkbox" checked={viewingHoliday.is_restricted || false} disabled style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
                      Restricted/Optional Holiday
                    </label>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Remarks</label>
                    <textarea value={viewingHoliday.remarks || ''} disabled rows={2} className="form-control" />
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
