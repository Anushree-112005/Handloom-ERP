import React, { useState, useEffect } from 'react';
import { BookOpen, Award, Plus, Trash2, Users, Calendar, CheckCircle, X, GraduationCap, Edit2, Clock, ExternalLink, Filter, LayoutList, LayoutGrid, Sparkles } from 'lucide-react';
import hrService, { 
  fetchTrainingPrograms, createTrainingProgram, updateTrainingProgram, deleteTrainingProgram,
  fetchCertifications, createCertification, updateCertification, deleteCertification,
  fetchEmployees
} from '../../../services/hrService';

const LearningDevelopment = () => {
  const [activeTab, setActiveTab] = useState('training');
  const [programs, setPrograms] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editingCert, setEditingCert] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCertStatus, setFilterCertStatus] = useState('');
  
  const [programForm, setProgramForm] = useState({
    title: '', category: 'Technical', trainer: '', description: '',
    start_date: '', end_date: '', duration_hours: '', max_participants: 50,
    mode: 'Online', status: 'Scheduled', is_mandatory: false, department: 'All'
  });
  const [certForm, setCertForm] = useState({
    employee_id: '', name: '', issuing_authority: '', credential_id: '',
    issue_date: '', expiry_date: '', credential_url: '', status: 'Active'
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progs, certs, emps] = await Promise.all([
        fetchTrainingPrograms().catch(() => []),
        fetchCertifications().catch(() => []),
        fetchEmployees().catch(() => [])
      ]);
      setPrograms(progs || []);
      setCertifications(certs || []);
      setEmployees(emps || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  };

  const resetTrainingForm = () => {
    setProgramForm({
      title: '', category: 'Technical', trainer: '', description: '',
      start_date: '', end_date: '', duration_hours: '', max_participants: 50,
      mode: 'Online', status: 'Scheduled', is_mandatory: false, department: 'All'
    });
    setEditingProgram(null);
    setShowTrainingForm(false);
  };

  const resetCertForm = () => {
    setCertForm({
      employee_id: '', name: '', issuing_authority: '', credential_id: '',
      issue_date: '', expiry_date: '', credential_url: '', status: 'Active'
    });
    setEditingCert(null);
    setShowCertForm(false);
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    const requiredFields = [
      { field: 'title', label: 'Program Title' },
      { field: 'trainer', label: 'Trainer' },
    ];
    const missingFields = requiredFields.filter(f => !programForm[f.field]?.toString().trim());
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` });
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...programForm,
        duration_hours: parseFloat(programForm.duration_hours) || null,
        max_participants: parseInt(programForm.max_participants) || 50,
        start_date: programForm.start_date || null,
        end_date: programForm.end_date || null,
      };
      
      if (editingProgram) {
        await updateTrainingProgram(editingProgram.id, payload);
        setMessage({ type: 'success', text: 'Training program updated!' });
      } else {
        await createTrainingProgram(payload);
        setMessage({ type: 'success', text: 'Training program added!' });
      }
      await loadData();
      resetTrainingForm();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessage({ type: 'error', text: typeof detail === 'string' ? detail : 'Failed to save program' });
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddCert = async (e) => {
    e.preventDefault();
    const requiredFields = [
      { field: 'employee_id', label: 'Employee' },
      { field: 'name', label: 'Certification Name' },
    ];
    const missingFields = requiredFields.filter(f => !certForm[f.field]?.toString().trim());
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` });
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...certForm,
        employee_id: parseInt(certForm.employee_id),
        issue_date: certForm.issue_date || null,
        expiry_date: certForm.expiry_date || null,
      };
      
      if (editingCert) {
        await updateCertification(editingCert.id, payload);
        setMessage({ type: 'success', text: 'Certification updated!' });
      } else {
        await createCertification(payload);
        setMessage({ type: 'success', text: 'Certification added!' });
      }
      await loadData();
      resetCertForm();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessage({ type: 'error', text: typeof detail === 'string' ? detail : 'Failed to save certification' });
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const updateProgramStatus = async (id, status) => {
    try {
      await updateTrainingProgram(id, { status });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Delete this training program?')) return;
    try {
      await deleteTrainingProgram(id);
      await loadData();
      setMessage({ type: 'success', text: 'Program deleted!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete program' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDeleteCert = async (id) => {
    if (!window.confirm('Delete this certification?')) return;
    try {
      await deleteCertification(id);
      await loadData();
      setMessage({ type: 'success', text: 'Certification deleted!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete certification' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEditProgram = (prog) => {
    setProgramForm({
      title: prog.title || '',
      category: prog.category || 'Technical',
      trainer: prog.trainer || '',
      description: prog.description || '',
      start_date: prog.start_date || '',
      end_date: prog.end_date || '',
      duration_hours: prog.duration_hours || '',
      max_participants: prog.max_participants || 50,
      mode: prog.mode || 'Online',
      status: prog.status || 'Scheduled',
      is_mandatory: prog.is_mandatory || false,
      department: prog.department || 'All'
    });
    setEditingProgram(prog);
    setShowTrainingForm(true);
  };

  const handleEditCert = (cert) => {
    setCertForm({
      employee_id: cert.employee_id || '',
      name: cert.name || '',
      issuing_authority: cert.issuing_authority || '',
      credential_id: cert.credential_id || '',
      issue_date: cert.issue_date || '',
      expiry_date: cert.expiry_date || '',
      credential_url: cert.credential_url || '',
      status: cert.status || 'Active'
    });
    setEditingCert(cert);
    setShowCertForm(true);
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : 'Unknown';
  };

  // Filtered data
  const filteredPrograms = programs.filter(prog => {
    const matchesStatus = !filterStatus || prog.status === filterStatus;
    const matchesCategory = !filterCategory || prog.category === filterCategory;
    return matchesStatus && matchesCategory;
  });

  const filteredCertifications = certifications.filter(cert => {
    if (!filterCertStatus) return true;
    const status = getCertStatus(cert.expiry_date);
    return status.label === filterCertStatus;
  });

  // Stats
  const stats = {
    totalPrograms: programs.length,
    activePrograms: programs.filter(p => p.status === 'In Progress').length,
    completedPrograms: programs.filter(p => p.status === 'Completed').length,
    totalCerts: certifications.length,
  };

  const handleSkillGapAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const activeCerts = certifications.map(c => c.name);
      
      const req = {
        "workforce_skills": activeCerts,
        "role_requirements": {
           "Machine Operator": ["CNC Operations", "Safety Certification"],
           "Developer": ["React", "Python", "Docker"]
        }
      };
      
      const res = await hrService.analyzeSkillGaps(req.workforce_skills, req.role_requirements);
      if(res.analysis) {
        setAiAnalysis(res.analysis);
        setShowAiModal(true);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'AI Skill Gap Analysis failed.' });
    }
    setIsAnalyzing(false);
  };

  const getCertStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'No Expiry', color: 'bg-slate-100 text-slate-700' };
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    if (daysUntilExpiry <= 30) return { label: 'Expiring', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Valid', color: 'bg-emerald-100 text-emerald-700' };
  };

  if (loading && programs.length === 0 && certifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + stat badges */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">LEARNING & DEVEL</h1>
          <span className="btn btn-primary">
            {stats.activePrograms} Active Programs
          </span>
          <span className="btn btn-success">
            {stats.totalCerts} Certifications
          </span>
        </div>

        {/* RIGHT: Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* AI Skill Gap Analysis */}
          <button
            onClick={handleSkillGapAnalysis}
            disabled={isAnalyzing}
            className="btn btn-primary"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'AI Skill Gap'}
          </button>

          {/* Filter Dropdown */}
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">LEARNING & DEVELOPMENT</h1>
          <span className="btn btn-primary">
            {stats.totalPrograms} Programs
          </span>
          <span className="btn btn-success">
            {stats.totalCerts} Certifications
          </span>
        </div>

        {/* RIGHT: Filter dropdown + view toggle + Add button */}
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
              {(filterStatus || filterCategory || filterCertStatus) && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterCertStatus(''); }} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                {activeTab === 'training' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="form-control">
                        <option value="">All Status</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                        className="form-control">
                        <option value="">All Categories</option>
                        <option value="Technical">Technical</option>
                        <option value="Soft Skills">Soft Skills</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Safety">Safety</option>
                        <option value="Product">Product</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Certification Status</label>
                    <select value={filterCertStatus} onChange={(e) => setFilterCertStatus(e.target.value)}
                      className="form-control">
                      <option value="">All Status</option>
                      <option value="Valid">Valid</option>
                      <option value="Expiring">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                      <option value="No Expiry">No Expiry</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="btn btn-secondary">
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>

          {activeTab === 'training' ? (
            <button onClick={() => setShowTrainingForm(true)}
              className="btn btn-primary">
              <Plus className="w-4 h-4" /> Add Program
            </button>
          ) : (
            <button onClick={() => setShowCertForm(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-amber-700 transition-all">
              <Plus className="w-4 h-4" /> Add Certification
            </button>
          )}
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

      {/* Stats Cards */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-medium">Active Training</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{stats.activePrograms}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{stats.completedPrograms}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs font-medium">Certifications</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{stats.totalCerts}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Employees</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{employees.length}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 rounded-lg p-1">
        <button onClick={() => setActiveTab('training')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'training' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
          }`}>
          <BookOpen className="w-4 h-4" /> Training Programs
        </button>
        <button onClick={() => setActiveTab('certs')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'certs' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
          }`}>
          <Award className="w-4 h-4" /> Certifications
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <>
          {/* Training Form Modal */}
          {showTrainingForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
              <div className="card">
                <div className="btn btn-secondary">
                  <h2 className="card-title">{editingProgram ? 'Edit' : 'Add'} Training Program</h2>
                  <button onClick={resetTrainingForm} className="btn btn-secondary"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleAddProgram} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Program Title *</label>
                    <input type="text" value={programForm.title}
                      onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                      className="form-control" placeholder="e.g., React Advanced Training" />
                  </div>
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                      <select value={programForm.category} onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}
                        className="form-control">
                        <option>Technical</option><option>Soft Skills</option><option>Compliance</option><option>Leadership</option><option>Safety</option><option>Product</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
                      <select value={programForm.mode} onChange={(e) => setProgramForm({ ...programForm, mode: e.target.value })}
                        className="form-control">
                        <option>Online</option><option>Classroom</option><option>Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Trainer *</label>
                      <input type="text" value={programForm.trainer}
                        onChange={(e) => setProgramForm({ ...programForm, trainer: e.target.value })}
                        className="form-control" placeholder="Trainer name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Hours)</label>
                      <input type="number" min="0" value={programForm.duration_hours}
                        onChange={(e) => setProgramForm({ ...programForm, duration_hours: e.target.value })}
                        className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                      <input type="date" value={programForm.start_date}
                        onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })}
                        className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                      <input type="date" value={programForm.end_date}
                        onChange={(e) => setProgramForm({ ...programForm, end_date: e.target.value })}
                        className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
                      <input type="number" min="1" value={programForm.max_participants}
                        onChange={(e) => setProgramForm({ ...programForm, max_participants: e.target.value })}
                        className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                      <input type="text" value={programForm.department}
                        onChange={(e) => setProgramForm({ ...programForm, department: e.target.value })}
                        className="form-control" placeholder="All or specific" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="mandatory" checked={programForm.is_mandatory}
                      onChange={(e) => setProgramForm({ ...programForm, is_mandatory: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded" />
                    <label htmlFor="mandatory" className="text-sm text-slate-700">Mandatory Training</label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={resetTrainingForm}
                      className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={loading}
                      className="btn btn-primary">
                      {loading ? 'Saving...' : editingProgram ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Training List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredPrograms.length === 0 ? (
              <div className="card">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No training programs yet</p>
              </div>
              ) : filteredPrograms.map((prog) => (
              <div key={prog.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{prog.title}</p>
                      {prog.is_mandatory && (
                        <span className="btn btn-danger">Mandatory</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{prog.category} • {prog.mode} • {prog.trainer}</p>
                    {prog.duration_hours > 0 && (
                      <p className="text-xs text-slate-400">{prog.duration_hours}h duration • Max {prog.max_participants} participants</p>
                    )}
                  </div>
                  <select value={prog.status || 'Scheduled'} onChange={(e) => updateProgramStatus(prog.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      prog.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      prog.status === 'In Progress' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      prog.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700' :
                      'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                    <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                  </select>
                </div>
                {(prog.start_date || prog.end_date) && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {prog.start_date || 'TBD'} → {prog.end_date || 'TBD'}
                  </p>
                )}
                <div className="btn btn-secondary">
                  <button onClick={() => handleEditProgram(prog)} className="btn btn-primary">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteProgram(prog.id)} className="btn btn-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}

          {/* Training Grid View */}
          {viewMode === 'grid' && (
            <div className="form-row">
              {filteredPrograms.length === 0 ? (
                <div className="btn btn-secondary">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No training programs yet</p>
                </div>
              ) : filteredPrograms.map((prog) => (
                <div key={prog.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-sm">{prog.title}</p>
                      {prog.is_mandatory && (
                        <span className="btn btn-danger">Mandatory</span>
                      )}
                    </div>
                    <select value={prog.status || 'Scheduled'} onChange={(e) => updateProgramStatus(prog.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${
                        prog.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        prog.status === 'In Progress' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        prog.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700' :
                        'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                      <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{prog.category} • {prog.mode}</p>
                  <p className="text-xs text-slate-500 mb-2">Trainer: {prog.trainer}</p>
                  {prog.duration_hours > 0 && (
                    <p className="text-xs text-slate-400 mb-2">{prog.duration_hours}h • Max {prog.max_participants}</p>
                  )}
                  {(prog.start_date || prog.end_date) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                      <Calendar className="w-3 h-3" /> {prog.start_date || 'TBD'} → {prog.end_date || 'TBD'}
                    </p>
                  )}
                  <div className="btn btn-secondary">
                    <button onClick={() => handleEditProgram(prog)} className="btn btn-secondary">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDeleteProgram(prog.id)} className="btn btn-danger">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certs' && (
        <>
          {/* Cert Form Modal */}
          {showCertForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
              <div className="card">
                <div className="btn btn-secondary">
                  <h2 className="card-title">{editingCert ? 'Edit' : 'Add'} Certification</h2>
                  <button onClick={resetCertForm} className="btn btn-secondary"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleAddCert} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                    <select value={certForm.employee_id}
                      onChange={(e) => setCertForm({ ...certForm, employee_id: e.target.value })}
                      className="form-control" required>
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Certification Name *</label>
                    <input type="text" value={certForm.name}
                      onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                      className="form-control" placeholder="e.g., AWS Solutions Architect" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Issuing Authority *</label>
                    <input type="text" value={certForm.issuing_authority}
                      onChange={(e) => setCertForm({ ...certForm, issuing_authority: e.target.value })}
                      className="form-control" placeholder="e.g., Amazon Web Services" required />
                  </div>
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date *</label>
                      <input type="date" value={certForm.issue_date}
                        onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
                        className="form-control" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                      <input type="date" value={certForm.expiry_date}
                        onChange={(e) => setCertForm({ ...certForm, expiry_date: e.target.value })}
                        className="form-control" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Credential ID</label>
                      <input type="text" value={certForm.credential_id}
                        onChange={(e) => setCertForm({ ...certForm, credential_id: e.target.value })}
                        className="form-control" placeholder="Certificate number" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Credential URL</label>
                      <input type="url" value={certForm.credential_url}
                        onChange={(e) => setCertForm({ ...certForm, credential_url: e.target.value })}
                        className="form-control" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={resetCertForm}
                      className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={loading}
                      className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50">
                      {loading ? 'Saving...' : editingCert ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Certification List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredCertifications.length === 0 ? (
              <div className="card">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No certifications tracked</p>
              </div>
              ) : filteredCertifications.map((cert) => {
                const status = getCertStatus(cert.expiry_date);
                return (
                  <div key={cert.id} className="card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{cert.name}</p>
                        <p className="text-sm text-slate-700">{getEmployeeName(cert.employee_id)}</p>
                        <p className="text-xs text-slate-500">{cert.issuing_authority || 'N/A'} • {cert.issue_date || 'N/A'}</p>
                        {cert.credential_id && (
                          <p className="text-xs text-slate-400">ID: {cert.credential_id}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> View Certificate
                      </a>
                    )}
                    <div className="btn btn-secondary">
                      <button onClick={() => handleEditCert(cert)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteCert(cert.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Certification Grid View */}
          {viewMode === 'grid' && (
            <div className="form-row">
              {filteredCertifications.length === 0 ? (
                <div className="btn btn-secondary">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No certifications tracked</p>
                </div>
              ) : filteredCertifications.map((cert) => {
                const status = getCertStatus(cert.expiry_date);
                return (
                  <div key={cert.id} className="card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-sm">{cert.name}</p>
                        <p className="text-xs text-slate-700 truncate mt-0.5">{getEmployeeName(cert.employee_id)}</p>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{cert.issuing_authority || 'N/A'}</p>
                    <p className="text-xs text-slate-400 mb-2">Issue: {cert.issue_date || 'N/A'}</p>
                    {cert.credential_id && (
                      <p className="text-xs text-slate-400 truncate mb-2">ID: {cert.credential_id}</p>
                    )}
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mb-2">
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    )}
                    <div className="btn btn-secondary">
                      <button onClick={() => handleEditCert(cert)} className="btn btn-secondary">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDeleteCert(cert.id)} className="btn btn-danger">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      </div>{/* END DATA AREA */}
      {/* AI Skill Gap Analysis Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card">
            <div className="btn btn-secondary">
              <div className="flex items-center gap-3">
                <div className="btn btn-primary">
                  <Sparkles size={16} />
                </div>
                <h2 className="card-title">AI Skill Gap Analysis</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {!aiAnalysis ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No analysis data available.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Identified Skill Gaps</h3>
                    <div className="space-y-3">
                      {(aiAnalysis.skill_gaps || []).map((gap, idx) => (
                        <div key={idx} className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-amber-900">{gap.skill}</p>
                            <p className="text-amber-700 text-xs mt-0.5">Missing or under-represented</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            gap.criticality === 'High' ? 'bg-red-100 text-red-700' :
                            gap.criticality === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {gap.criticality} Priority
                          </span>
                        </div>
                      ))}
                      {(!aiAnalysis.skill_gaps || aiAnalysis.skill_gaps.length === 0) && (
                        <p className="text-sm text-slate-500">No significant skill gaps identified.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">AI Recommendations</h3>
                    <ul className="space-y-2">
                      {(aiAnalysis.recommendations || []).map((rec, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningDevelopment;
