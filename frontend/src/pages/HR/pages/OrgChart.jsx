import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, Building2, Mail, Phone, Filter, RefreshCw, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchOrgChart } from '../../../services/hrService';

export default function OrgChart() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // tree, grid
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchOrgChart();
      setEmployees(data);
      // Expand first level by default
      const topLevel = data.filter(e => !e.reporting_manager_id).map(e => e.id);
      setExpandedNodes(new Set(topLevel));
    } catch (error) {
      console.error('Error loading org chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDept || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const toggleNode = (id) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const getDirectReports = (managerId) => {
    return filteredEmployees.filter(e => e.reporting_manager_id === managerId);
  };

  const topLevelEmployees = filteredEmployees.filter(e => !e.reporting_manager_id);

  const renderTreeNode = (employee, level = 0) => {
    const reports = getDirectReports(employee.id);
    const hasReports = reports.length > 0;
    const isExpanded = expandedNodes.has(employee.id);

    return (
      <div key={employee.id} className="select-none">
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors ${level === 0 ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : ''}`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => hasReports && toggleNode(employee.id)}
        >
          {hasReports ? (
            <button className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${level === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-400'}`}>
            {employee.name?.charAt(0) || '?'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800 truncate">{employee.name}</span>
              {hasReports && (
                <span className="btn btn-primary">
                  {reports.length}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500 truncate">{employee.designation}</div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {employee.department || '—'}
            </span>
          </div>
        </div>
        
        {isExpanded && hasReports && (
          <div className="border-l-2 border-indigo-100 ml-6">
            {reports.map(report => renderTreeNode(report, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => (
    <div className="form-row">
      {filteredEmployees.map(emp => (
        <div key={emp.id} className="card">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {emp.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{emp.name}</h3>
              <p className="text-sm text-indigo-600 truncate">{emp.designation}</p>
              <p className="text-xs text-slate-500 mt-1">{emp.department}</p>
            </div>
          </div>
          
          <div className="btn btn-secondary">
            {emp.email && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="w-3 h-3" />
                <span className="truncate">{emp.email}</span>
              </div>
            )}
            {emp.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{emp.phone}</span>
              </div>
            )}
          </div>
          
          {emp.reporting_manager_id && (
            <div className="btn btn-secondary">
              <span className="text-xs text-slate-400">Reports to:</span>
              <p className="text-xs font-medium text-slate-600">
                {employees.find(e => e.id === emp.reporting_manager_id)?.name || '—'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + badge */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Organization Chart</h1>
          <span className="btn btn-primary">
            {employees.length} Records
          </span>
        </div>

        {/* RIGHT: Filter + View Toggle */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {(selectedDept || searchTerm) && (
                <span className="btn btn-primary" />
              )}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button
                    onClick={() => { setSelectedDept(''); setSearchTerm(''); }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="btn btn-secondary">
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              title="Tree View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
        <div className="card">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No employees found</p>
            </div>
          ) : viewMode === 'tree' ? (
            <div className="space-y-1">
              {topLevelEmployees.length > 0 ? (
                topLevelEmployees.map(emp => renderTreeNode(emp, 0))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No hierarchy found. Showing all employees:</p>
                  <div className="mt-4">
                    {filteredEmployees.map(emp => renderTreeNode(emp, 0))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            renderGridView()
          )}
        </div>
      </div>

    </div>
  );
}
