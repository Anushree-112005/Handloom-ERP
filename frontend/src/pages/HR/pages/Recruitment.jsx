import React, { useEffect, useMemo, useState } from 'react';
import { Plus, ArrowRight, AlertCircle, CheckCircle2, Trash2, X, Users, Calendar, Briefcase, MapPin, FileText, Eye, LayoutList, LayoutGrid, Filter, Sparkles, Upload } from 'lucide-react';
import hrService, { fetchRequisitions, deleteCandidate as deleteCandidateAPI } from '../../../services/hrService';

// Helper to extract error message from API response
const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
  if (typeof detail === 'object') return detail.msg || detail.message || JSON.stringify(detail);
  return defaultMsg;
};

const stages = ['New', 'Screening', 'Interview', 'Selected', 'Rejected'];
const weights = { technical: 0.4, communication: 0.3, domain: 0.2, culture: 0.1 };

const computeScore = (rating) => {
  if (!rating) return 0;
  const total = (rating.technical || 0) * weights.technical + (rating.communication || 0) * weights.communication + (rating.domain || 0) * weights.domain + (rating.culture || 0) * weights.culture;
  return Number(total.toFixed(1));
};

const initialForm = {
  name: '', email: '', phone: '', position_applied: '', source: 'Manual', expected_salary: 0, status: 'New',
  // New fields
  currentCompany: '', currentDesignation: '', currentCTC: '', totalExperience: '', relevantExperience: '',
  noticePeriod: '30', currentLocation: '', preferredLocation: '', willingToRelocate: false,
  education: '', linkedinUrl: '', resumeUrl: '', interviewDate: '', interviewTime: '', interviewType: 'Video',
  notes: ''
};

const Recruitment = () => {
  const [candidates, setCandidates] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [rating, setRating] = useState({ technical: 0, communication: 0, domain: 0, culture: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [formTab, setFormTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [screening, setScreening] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [candData, reqData] = await Promise.all([
        hrService.listCandidates(),
        fetchRequisitions()
      ]);
      setCandidates(candData);
      setRequisitions(reqData);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  const pipelineCounts = useMemo(() => {
    const counts = { New: 0, Screening: 0, Interview: 0, Selected: 0, Rejected: 0, All: candidates.length };
    candidates.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [candidates]);

  const resetForm = () => {
    setForm(initialForm);
    setRating({ technical: 0, communication: 0, domain: 0, culture: 0 });
    setShowForm(false);
    setResumeFile(null);
    setScreening(false);
  };

  const handleScreenResume = async () => {
    if (!resumeFile || !form.position_applied) {
      setError('Please upload a resume and enter position to screen.');
      return;
    }
    
    setScreening(true);
    try {
      const formData = new FormData();
      formData.append('job_description', `Job Title: ${form.position_applied}`);
      formData.append('file', resumeFile);

      const res = await hrService.screenResume(formData);
      
      const analysis = res.ai_analysis;
      if (analysis) {
        // Auto-fill ratings (heuristic: distribute score across categories)
        const score = analysis.score || 0;
        const normalized = Math.min(5, Math.max(0, score / 20));
        setRating({
            technical: normalized,
            communication: normalized, 
            domain: normalized,
            culture: normalized
        });
        
        // Auto-fill notes
        const summary = `
AI Analysis (Score: ${score}/100):
${analysis.summary || 'No summary'}

Strengths:
- ${(analysis.strengths || []).join('\n- ')}

Missing Skills:
- ${(analysis.missing || []).join('\n- ')}
        `.trim();
        
        setForm(prev => ({ ...prev, notes: summary }));
        setSuccess('Resume Screened Successfully!');
      }
    } catch (err) {
      setError('AI Screening failed. Ensure backend service is running.');
    } finally {
      setScreening(false);
    }
    setFormTab('basic');
    setError('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields and show specific missing fields
    const requiredFields = [
      { field: 'name', label: 'Candidate Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'position_applied', label: 'Position Applied' },
    ];
    const missingFields = requiredFields.filter(f => !form[f.field] || form[f.field].toString().trim() === '');
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    const duplicate = candidates.find((c) => c.email === form.email || c.phone === form.phone);
    if (duplicate) {
      setError('Duplicate detected (email or phone already exists).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        position_applied: form.position_applied,
        source: form.source,
        expected_salary: Number(form.expected_salary) || 0,
        status: 'New',
        rating_technical: rating.technical,
        rating_communication: rating.communication,
        rating_domain: rating.domain,
        rating_culture: rating.culture,
        timeline: [{ stage: 'New', by: 'HR', note: 'Created', at: new Date().toISOString() }],
      };
      await hrService.createCandidate(payload);
      setSuccess('Candidate added successfully!');
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add candidate'));
    }
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const advanceStage = async (id, next) => {
    try {
      await hrService.updateCandidate(id, { status: next });
      await loadData();
    } catch (err) {
      setError('Failed to update stage');
    }
  };

  const updateRating = async (id, field, value) => {
    try {
      const ratingField = `rating_${field}`;
      await hrService.updateCandidate(id, { [ratingField]: Number(value) });
      await loadData();
    } catch (err) {
      setError('Failed to update rating');
    }
  };

  const deleteCandidate = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try {
      await deleteCandidateAPI(id);
      setCandidates(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError('Failed to delete candidate. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filtered = activeFilter === 'All' ? candidates : candidates.filter(c => c.status === activeFilter);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title & Count */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Candidates</h1>
          <span className="btn btn-primary">
            {filtered.length} Records
          </span>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="btn btn-secondary">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>
          <button onClick={() => setShowForm(true)}
            className="btn btn-primary">
            <Plus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Pipeline Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {['All', ...stages].map((s) => (
            <button key={s} onClick={() => setActiveFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
              {s} <span className="ml-1 opacity-75">({pipelineCounts[s]})</span>
            </button>
          ))}
        </div>

        {/* Success Message */}
        {success && (
          <div className="btn btn-success">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Add Candidate Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
            <div className="card">
              <div className="btn btn-secondary">
                <h2 className="card-title">Add Candidate</h2>
                <button onClick={resetForm} className="btn btn-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Tabs */}
              <div className="btn btn-secondary">
                {[
                  { id: 'basic', label: 'Basic Info' },
                  { id: 'experience', label: 'Experience' },
                  { id: 'interview', label: 'Interview' },
                  { id: 'ratings', label: 'Ratings' }
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setFormTab(tab.id)}
                    className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${formTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500'
                      }`}>{tab.label}</button>
                ))}
              </div>

              <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-4">
                {/* Basic Info Tab */}
                {formTab === 'basic' && (
                  <div className="space-y-4">
                    {/* Resume Upload Section */}
                    <div className="btn btn-primary">
                      <label className="block text-sm font-medium text-indigo-900 mb-2">Resume Auto-Fill (PDF/Doc)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files[0])}
                          className="btn btn-primary"
                        />
                        <button
                          type="button"
                          onClick={handleScreenResume}
                          disabled={!resumeFile || screening}
                          className="btn btn-primary"
                        >
                          <Sparkles size={16} className={screening ? "animate-spin" : ""} />
                          {screening ? "Analyzing..." : "Auto-Fill"}
                        </button>
                      </div>
                      <p className="text-xs text-indigo-600 mt-2">Upload a resume to automatically extract candidate details.</p>
                    </div>

                    <div className="form-row">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input className="form-control"
                          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                        <input type="email" className="form-control"
                          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                        <input className="form-control"
                          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                        <input className="form-control"
                          value={form.position_applied} onChange={(e) => setForm({ ...form, position_applied: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                        <select className="form-control"
                          value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                          <option>Manual</option><option>LinkedIn</option><option>Indeed</option><option>Naukri</option><option>Agency</option><option>Referral</option><option>Campus</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Education</label>
                        <input className="form-control"
                          placeholder="B.Tech in CS, MBA, etc."
                          value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                        <input className="form-control"
                          placeholder="https://linkedin.com/in/..."
                          value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Resume URL</label>
                        <input className="form-control"
                          placeholder="Link to resume/CV"
                          value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expected Salary (₹)</label>
                        <input type="number" className="form-control"
                          placeholder="Annual salary expectation"
                          value={form.expected_salary} onChange={(e) => setForm({ ...form, expected_salary: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Experience Tab */}
                {formTab === 'experience' && (
                  <div className="space-y-4">
                    <div className="form-row">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Company</label>
                        <input className="form-control"
                          placeholder="Company name"
                          value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Designation</label>
                        <input className="form-control"
                          placeholder="Job title"
                          value={form.currentDesignation} onChange={(e) => setForm({ ...form, currentDesignation: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Experience (Years)</label>
                        <input type="number" step="0.5" className="form-control"
                          value={form.totalExperience} onChange={(e) => setForm({ ...form, totalExperience: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Relevant Experience (Years)</label>
                        <input type="number" step="0.5" className="form-control"
                          value={form.relevantExperience} onChange={(e) => setForm({ ...form, relevantExperience: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current CTC (₹ LPA)</label>
                        <input type="number" className="form-control"
                          value={form.currentCTC} onChange={(e) => setForm({ ...form, currentCTC: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expected CTC (₹ LPA)</label>
                        <input type="number" className="form-control"
                          value={form.expectedSalary} onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period (Days)</label>
                        <select className="form-control"
                          value={form.noticePeriod} onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })}>
                          <option value="0">Immediate</option><option value="15">15 days</option><option value="30">30 days</option>
                          <option value="60">60 days</option><option value="90">90 days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
                        <input className="form-control"
                          placeholder="City"
                          value={form.currentLocation} onChange={(e) => setForm({ ...form, currentLocation: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Location</label>
                        <input className="form-control"
                          placeholder="City"
                          value={form.preferredLocation} onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })} />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={form.willingToRelocate}
                            onChange={(e) => setForm({ ...form, willingToRelocate: e.target.checked })}
                            className="btn btn-secondary" />
                          Willing to Relocate
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interview Tab */}
                {formTab === 'interview' && (
                  <div className="space-y-4">
                    <div className="form-row">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Interview Date</label>
                        <input type="date" className="form-control"
                          value={form.interviewDate} onChange={(e) => setForm({ ...form, interviewDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Interview Time</label>
                        <input type="time" className="form-control"
                          value={form.interviewTime} onChange={(e) => setForm({ ...form, interviewTime: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Interview Type</label>
                        <select className="form-control"
                          value={form.interviewType} onChange={(e) => setForm({ ...form, interviewType: e.target.value })}>
                          <option>Video</option><option>Phone</option><option>In-Person</option><option>Technical Test</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Comments</label>
                      <textarea rows={4} className="form-control"
                        placeholder="Interview notes, feedback, observations..."
                        value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                )}

                {/* Ratings Tab */}
                {formTab === 'ratings' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Rate the candidate on a scale of 0-5 for each competency.</p>
                    <div className="form-row">
                      {['technical', 'communication', 'domain', 'culture'].map((field) => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{field} Skills</label>
                          <div className="flex items-center gap-2">
                            <input type="range" min={0} max={5} step={0.5}
                              className="flex-1"
                              value={rating[field]} onChange={(e) => setRating({ ...rating, [field]: parseFloat(e.target.value) })} />
                            <span className="w-10 text-center text-sm font-medium text-indigo-600">{rating[field]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="btn btn-primary">
                      <p className="text-sm text-slate-600">Weighted Score</p>
                      <p className="text-3xl font-bold text-indigo-600">{computeScore(rating)}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-4">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
              </form>

              <div className="btn btn-secondary">
                <button type="button" onClick={resetForm}
                  className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleAdd}
                  className="btn btn-primary">
                  Add Candidate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Candidate Modal */}
        {viewingCandidate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
            <div className="card">
              <div className="btn btn-secondary">
                <h2 className="card-title">Candidate Details</h2>
                <button onClick={() => setViewingCandidate(null)} className="btn btn-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className="btn btn-primary">
                    <Users className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-lg">{viewingCandidate.name}</h3>
                  <p className="text-sm text-indigo-600">{viewingCandidate.position_applied}</p>
                  <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${viewingCandidate.status === 'Selected' ? 'bg-emerald-100 text-emerald-700' :
                    viewingCandidate.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>{viewingCandidate.status}</span>
                </div>
                <div className="form-row">
                  <div><span className="text-slate-500">Email:</span> <span className="block font-medium">{viewingCandidate.email}</span></div>
                  <div><span className="text-slate-500">Phone:</span> <span className="block font-medium">{viewingCandidate.phone}</span></div>
                  <div><span className="text-slate-500">Position:</span> <span className="block font-medium">{viewingCandidate.position_applied}</span></div>
                  <div><span className="text-slate-500">Source:</span> <span className="block font-medium">{viewingCandidate.source || '—'}</span></div>
                  <div><span className="text-slate-500">Expected Salary:</span> <span className="block font-medium">{viewingCandidate.expected_salary !== null && viewingCandidate.expected_salary !== undefined && viewingCandidate.expected_salary !== 0 ? `₹${viewingCandidate.expected_salary}` : '—'}</span></div>
                  <div><span className="text-slate-500">Status:</span> <span className="block font-medium">{viewingCandidate.status}</span></div>
                </div>
                {viewingCandidate.timeline && viewingCandidate.timeline.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-2">Timeline</p>
                    <div className="space-y-1 text-xs">
                      {viewingCandidate.timeline.map((entry, idx) => (
                        <p key={idx} className="text-slate-600">{entry.stage} - {entry.note} by {entry.by}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="btn btn-primary">
                  <p className="text-xs text-slate-500 mb-1">Weighted Score</p>
                  <p className="text-2xl font-bold text-indigo-600">{computeScore(viewingCandidate.rating)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View - Vertical Cards */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No candidates found</p>
                <button onClick={() => setShowForm(true)} className="mt-3 text-indigo-600 text-sm font-medium">
                  + Add your first candidate
                </button>
              </div>
            ) : filtered.map((c) => {
              const score = computeScore(c.rating);
              const nextStageIndex = Math.min(stages.indexOf(c.status) + 1, stages.length - 1);
              const nextStage = stages[nextStageIndex];

              return (
                <div key={c.id} className="card">
                  {/* Header - Clickable */}
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setViewingCandidate(c)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="btn btn-primary">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-sm text-slate-500">{c.position_applied}</p>
                        </div>
                      </div>
                      {/* Additional Info Row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        {c.source && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">{c.source}</span>
                        )}
                        {c.expected_salary > 0 && (
                          <span className="text-emerald-600 font-medium">₹{c.expected_salary}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                      <span className="btn btn-primary">{score}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'Selected' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          c.status === 'Interview' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>{c.status}</span>
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="form-row">
                    {['technical', 'communication', 'domain', 'culture'].map((field) => (
                      <div key={field} className="text-center">
                        <p className="text-slate-500 capitalize truncate">{field.slice(0, 4)}</p>
                        <input type="number" min={0} max={5} step={0.1}
                          value={c[`rating_${field}`] || 0}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateRating(c.id, field, e.target.value)}
                          className="form-control" />
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="btn btn-secondary">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setViewingCandidate(c)}
                        className="btn btn-secondary">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      {c.status !== 'Selected' && c.status !== 'Rejected' && (
                        <button onClick={() => advanceStage(c.id, nextStage)}
                          className="btn btn-primary">
                          <ArrowRight className="w-3 h-3" /> {nextStage}
                        </button>
                      )}
                      {c.status !== 'Selected' && (
                        <button onClick={() => advanceStage(c.id, 'Selected')}
                          className="btn btn-success">
                          <CheckCircle2 className="w-3 h-3" /> Select
                        </button>
                      )}
                      {c.status !== 'Rejected' && (
                        <button onClick={() => advanceStage(c.id, 'Rejected')}
                          className="btn btn-danger">
                          Reject
                        </button>
                      )}
                    </div>
                    <button onClick={() => deleteCandidate(c.id)}
                      className="btn btn-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid View - Responsive Grid Cards */}
        {viewMode === 'grid' && (
          <div className="form-row">
            {filtered.length === 0 ? (
              <div className="btn btn-secondary">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No candidates found</p>
                <button onClick={() => setShowForm(true)} className="mt-3 text-indigo-600 text-sm font-medium">
                  + Add your first candidate
                </button>
              </div>
            ) : filtered.map((c) => {
              const score = computeScore(c.rating);
              const nextStageIndex = Math.min(stages.indexOf(c.status) + 1, stages.length - 1);
              const nextStage = stages[nextStageIndex];

              return (
                <div key={c.id} className={`relative bg-white border rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${selectedCandidates.includes(c.id) ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'border-slate-200 hover:border-indigo-300'}`}>
                  <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCandidates([...selectedCandidates, c.id]);
                        } else {
                          setSelectedCandidates(selectedCandidates.filter(id => id !== c.id));
                        }
                      }}
                      className={`w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer ${selectedCandidates.includes(c.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
                    />
                  </div>

                  <div className="mb-3 pr-8 cursor-pointer" onClick={() => setViewingCandidate(c)}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="btn btn-primary">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate" title={c.name}>{c.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{c.position_applied}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${c.status === 'Selected' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      c.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                        c.status === 'Interview' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>{c.status}</span>
                    {c.source && (
                      <span className="btn btn-secondary">{c.source}</span>
                    )}
                  </div>

                  <div className="btn btn-secondary">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Score</span>
                      <span className="btn btn-primary">{score}</span>
                    </div>
                    {c.expected_salary > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Expected</span>
                        <span className="font-medium text-emerald-600">₹{c.expected_salary}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    {['technical', 'communication', 'domain', 'culture'].map((field) => (
                      <div key={field} className="text-center">
                        <p className="text-slate-500 text-[10px] truncate capitalize">{field.slice(0, 4)}</p>
                        <input type="number" min={0} max={5} step={0.1}
                          value={c[`rating_${field}`] || 0}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateRating(c.id, field, e.target.value)}
                          className="form-control" />
                      </div>
                    ))}
                  </div>

                  <div className="btn btn-secondary" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => setViewingCandidate(c)}
                        className="btn btn-secondary">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button onClick={() => deleteCandidate(c.id)}
                        className="btn btn-danger">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.status !== 'Selected' && c.status !== 'Rejected' && (
                        <button onClick={() => advanceStage(c.id, nextStage)}
                          className="btn btn-primary">
                          <ArrowRight className="w-3 h-3" /> {nextStage}
                        </button>
                      )}
                      {c.status !== 'Selected' && (
                        <button onClick={() => advanceStage(c.id, 'Selected')}
                          className="btn btn-success">
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                      )}
                      {c.status !== 'Rejected' && (
                        <button onClick={() => advanceStage(c.id, 'Rejected')}
                          className="btn btn-danger">
                          X
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recruitment;
