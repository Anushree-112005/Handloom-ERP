import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Cpu, Save, Plus, Trash2, ArrowRight, CheckCircle, AlertCircle, FileText, RefreshCw, Layers
} from 'lucide-react';
import { textileDesignAPI } from '../../services/api';
import './DesignAI.css';

export default function DesignAI() {
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [activeTab, setActiveTab] = useState('header'); // header, warp, weft, results
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Form State
  const [form, setForm] = useState({
    design_name: '',
    weave_type: 'Plain',
    loom_width: 60,
    finished_width: 58,
    reed: 52,
    pick: 52,
    total_ends: 3120,
    total_picks: 52000,
    ppi: 52,
    epi: 52,
    fabric_length: 1000,
    warp_wastage_pct: 5,
    weft_wastage_pct: 3,
    status: 'Draft',
    warp_items: [],
    weft_items: []
  });

  // Fetch designs on load
  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const res = await textileDesignAPI.list();
      setDesigns(res.data);
      if (res.data.length > 0 && !selectedDesign) {
        handleSelectDesign(res.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch designs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDesign = (design) => {
    setSelectedDesign(design);
    setForm({
      design_name: design.design_name || '',
      weave_type: design.weave_type || 'Plain',
      loom_width: design.loom_width || 60,
      finished_width: design.finished_width || 58,
      reed: design.reed || 52,
      pick: design.pick || 52,
      total_ends: design.total_ends || 0,
      total_picks: design.total_picks || 0,
      ppi: design.ppi || 52,
      epi: design.epi || 52,
      fabric_length: design.fabric_length || 1000,
      warp_wastage_pct: design.warp_wastage_pct || 5,
      weft_wastage_pct: design.weft_wastage_pct || 3,
      status: design.status || 'Draft',
      warp_items: design.warp_items || [],
      weft_items: design.weft_items || []
    });
    setError(null);
    setSuccessMsg(null);
  };

  const handleNewDesign = () => {
    setSelectedDesign(null);
    setForm({
      design_name: '',
      weave_type: 'Plain',
      loom_width: 60,
      finished_width: 58,
      reed: 52,
      pick: 52,
      total_ends: 0,
      total_picks: 0,
      ppi: 52,
      epi: 52,
      fabric_length: 1000,
      warp_wastage_pct: 5,
      weft_wastage_pct: 3,
      status: 'Draft',
      warp_items: [],
      weft_items: []
    });
    setError(null);
    setSuccessMsg(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numFields = [
      'loom_width', 'finished_width', 'reed', 'pick',
      'total_ends', 'total_picks', 'ppi', 'epi',
      'fabric_length', 'warp_wastage_pct', 'weft_wastage_pct'
    ];
    setForm(prev => ({
      ...prev,
      [name]: numFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  // Warp Items Handlers
  const handleWarpChange = (index, field, value) => {
    const updated = [...form.warp_items];
    updated[index][field] = ['threads', 'ratio_pct', 'req_kg'].includes(field) ? parseFloat(value) || 0 : value;
    setForm(prev => ({ ...prev, warp_items: updated }));
  };

  const addWarpRow = () => {
    setForm(prev => ({
      ...prev,
      warp_items: [...prev.warp_items, { sno: prev.warp_items.length + 1, yarn_count: '40S', color: '', threads: 0, ratio_pct: 0, req_kg: 0 }]
    }));
  };

  const removeWarpRow = (index) => {
    const updated = form.warp_items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, sno: idx + 1 }));
    setForm(prev => ({ ...prev, warp_items: updated }));
  };

  // Weft Items Handlers
  const handleWeftChange = (index, field, value) => {
    const updated = [...form.weft_items];
    updated[index][field] = ['threads', 'ratio_pct', 'req_kg'].includes(field) ? parseFloat(value) || 0 : value;
    setForm(prev => ({ ...prev, weft_items: updated }));
  };

  const addWeftRow = () => {
    setForm(prev => ({
      ...prev,
      weft_items: [...prev.weft_items, { sno: prev.weft_items.length + 1, yarn_count: '30S', color: '', threads: 0, ratio_pct: 0, req_kg: 0 }]
    }));
  };

  const removeWeftRow = (index) => {
    const updated = form.weft_items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, sno: idx + 1 }));
    setForm(prev => ({ ...prev, weft_items: updated }));
  };

  // Image Upload handler
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedDesign) {
      // Image-First workflow: upload and analyze immediately
      try {
        setAnalyzing(true);
        setError(null);
        setSuccessMsg('Uploading and analyzing fabric image...');
        const res = await textileDesignAPI.analyzeImageOnly(file);
        const aiData = res.data;

        // Extract details
        const aiColors = aiData.ai_color_clusters || [];
        const aiEnds = aiData.ai_estimated_ends || [];

        // Populate Warp items using detected color clusters and ratios
        const warp_items = aiColors.map((color, index) => {
          const estimatedThreads = aiEnds[index]?.estimated_threads || Math.round((aiData.total_ends * color.ratio) / 100);
          return {
            sno: index + 1,
            yarn_count: '40S',
            color: color.color.charAt(0).toUpperCase() + color.color.slice(1),
            threads: estimatedThreads,
            ratio_pct: color.ratio,
            req_kg: 0
          };
        });

        // Populate Weft items with dominant color
        const weft_items = [
          {
            sno: 1,
            yarn_count: '30S',
            color: aiColors[0] ? aiColors[0].color.charAt(0).toUpperCase() + aiColors[0].color.slice(1) : 'White',
            threads: aiData.total_picks,
            ratio_pct: 100,
            req_kg: 0
          }
        ];

        // Update Form State with AI auto-fill
        setForm({
          design_name: `AI Design ${aiColors.map(c => c.color.charAt(0).toUpperCase() + c.color.slice(1)).join(' ')}`,
          weave_type: aiData.weave_type || 'Plain',
          loom_width: 60,
          finished_width: 58,
          reed: 52,
          pick: 52,
          total_ends: aiData.total_ends || 3248,
          total_picks: aiData.total_picks || 52000,
          ppi: aiData.ppi || 52,
          epi: aiData.epi || 52,
          fabric_length: 1000,
          warp_wastage_pct: 5,
          weft_wastage_pct: 3,
          status: 'Draft',
          image_path: aiData.image_path,
          ai_detected_weave: aiData.ai_detected_weave,
          ai_confidence: aiData.ai_confidence,
          ai_color_clusters: aiData.ai_color_clusters,
          ai_stripe_repeat: aiData.ai_stripe_repeat,
          ai_fft_profile: aiData.ai_fft_profile,
          ai_estimated_ends: aiData.ai_estimated_ends,
          ai_analysis_status: 'completed',
          warp_items,
          weft_items,
          warp_kg: 0,
          weft_kg: 0,
          total_kg: 0
        });

        setSuccessMsg('AI Fabric Analysis completed successfully! Form auto-populated.');
        setActiveTab('header');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to analyze fabric image.');
      } finally {
        setAnalyzing(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await textileDesignAPI.uploadImage(selectedDesign.id, file);
      setSuccessMsg('Fabric image uploaded successfully.');
      // Refresh selected design from server
      const updatedRes = await textileDesignAPI.get(selectedDesign.id);
      handleSelectDesign(updatedRes.data);
      fetchDesigns();
    } catch (err) {
      console.error(err);
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  // Run AI Analysis
  const runAIAnalysis = async () => {
    if (!selectedDesign || !selectedDesign.image_path) {
      setError('Please upload a fabric image first.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      await textileDesignAPI.analyze(selectedDesign.id);
      setSuccessMsg('AI Fabric analysis completed successfully.');
      // Refresh design data
      const updatedRes = await textileDesignAPI.get(selectedDesign.id);
      handleSelectDesign(updatedRes.data);
      setActiveTab('results');
      fetchDesigns();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'AI Service failed or is offline.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-fill from AI detection
  const autofillFromAI = () => {
    const source = selectedDesign || form;
    if (!source || !source.ai_color_clusters || source.ai_color_clusters.length === 0) {
      setError('No AI detection data available. Please upload a fabric image first.');
      return;
    }

    const aiColors = source.ai_color_clusters;
    const aiEnds = source.ai_estimated_ends || [];

    // Populate Warp items using detected color clusters and ratios
    const warp_items = aiColors.map((color, index) => {
      const estimatedThreads = aiEnds[index]?.estimated_threads || Math.round((form.total_ends * color.ratio) / 100);
      return {
        sno: index + 1,
        yarn_count: '40S',
        color: color.color.charAt(0).toUpperCase() + color.color.slice(1),
        threads: estimatedThreads,
        ratio_pct: color.ratio,
        req_kg: 0
      };
    });

    // Populate Weft items with dominant color
    const weft_items = [
      {
        sno: 1,
        yarn_count: '30S',
        color: aiColors[0] ? aiColors[0].color.charAt(0).toUpperCase() + aiColors[0].color.slice(1) : 'White',
        threads: form.total_picks,
        ratio_pct: 100,
        req_kg: 0
      }
    ];

    setForm(prev => ({
      ...prev,
      weave_type: source.ai_detected_weave || prev.weave_type,
      warp_items,
      weft_items
    }));
    setSuccessMsg('Form filled with AI-detected parameters. Make sure to Calculate Requirements next!');
  };

  // Run Yarn Requirement Calculator
  const runYarnCalculation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let currentDesign = selectedDesign;
      if (!currentDesign) {
        // Automatically save/create design entry in ERP first
        const res = await textileDesignAPI.create(form);
        currentDesign = res.data;
        setSelectedDesign(currentDesign);
      } else {
        // Save current state first to ensure db is sync'd
        await textileDesignAPI.update(currentDesign.id, form);
      }

      await textileDesignAPI.calculateRequirement(currentDesign.id);
      setSuccessMsg('Yarn requirement calculated using textile formulas.');
      const updatedRes = await textileDesignAPI.get(currentDesign.id);
      handleSelectDesign(updatedRes.data);
      fetchDesigns();
    } catch (err) {
      console.error(err);
      setError('Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  // Save design to database
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (selectedDesign) {
        const res = await textileDesignAPI.update(selectedDesign.id, form);
        setSuccessMsg('Design updated successfully.');
        handleSelectDesign(res.data);
      } else {
        const res = await textileDesignAPI.create(form);
        setSuccessMsg('New design entry created.');
        handleSelectDesign(res.data);
      }
      fetchDesigns();
    } catch (err) {
      console.error(err);
      setError('Failed to save design');
    } finally {
      setLoading(false);
    }
  };

  // Status Approvals
  const handleStatusChange = async (status) => {
    if (!selectedDesign) return;
    try {
      setLoading(true);
      setError(null);
      await textileDesignAPI.updateStatus(selectedDesign.id, status);
      setSuccessMsg(`Status updated to ${status}.`);
      const updatedRes = await textileDesignAPI.get(selectedDesign.id);
      handleSelectDesign(updatedRes.data);
      fetchDesigns();
    } catch (err) {
      console.error(err);
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Delete design
  const handleDelete = async () => {
    if (!selectedDesign) return;
    if (!window.confirm('Are you sure you want to delete this design?')) return;
    try {
      setLoading(true);
      await textileDesignAPI.delete(selectedDesign.id);
      setSuccessMsg('Design deleted.');
      setSelectedDesign(null);
      handleNewDesign();
      fetchDesigns();
    } catch (err) {
      console.error(err);
      setError('Failed to delete design');
    } finally {
      setLoading(false);
    }
  };

  // Custom keydown handler for tab transition in form fields
  const handleKeyDownTabTransition = (e, nextId) => {
    if (e.key === 'Tab') {
      const nextElem = document.getElementById(nextId);
      if (nextElem) {
        e.preventDefault();
        nextElem.focus();
      }
    }
  };

  return (
    <div className="dashboard-content design-ai-container">
      {/* Page Title */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 800 }}>
            <Sparkles style={{ color: 'var(--primary)' }} /> AI-Assisted Textile Design ERP
          </h1>
          <p className="text-muted" style={{ fontSize: 13 }}>
            Scan fabric images, analyze warp/weft color repeats using AI, and auto-calculate yarn requirements.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleNewDesign}>
            <Plus size={16} /> New Design
          </button>
        </div>
      </div>

      {/* Workflow Progress Bar */}
      <div className="ai-workflow-bar">
        <div className={`ai-workflow-step ${(selectedDesign?.image_path || form.image_path) ? 'completed' : 'active'}`}>
          1. Upload Fabric Image
        </div>
        <ArrowRight className="ai-workflow-arrow" size={14} />
        <div className={`ai-workflow-step ${(selectedDesign?.ai_analysis_status === 'completed' || form.ai_analysis_status === 'completed') ? 'completed' : analyzing ? 'active' : 'pending'}`}>
          2. AI Analysis
        </div>
        <ArrowRight className="ai-workflow-arrow" size={14} />
        <div className={`ai-workflow-step ${selectedDesign ? 'completed' : (selectedDesign?.ai_analysis_status === 'completed' || form.ai_analysis_status === 'completed') ? 'active' : 'pending'}`}>
          3. Auto Generated Design
        </div>
        <ArrowRight className="ai-workflow-arrow" size={14} />
        <div className={`ai-workflow-step ${(selectedDesign?.total_kg > 0 || form.total_kg > 0) ? 'completed' : selectedDesign ? 'active' : 'pending'}`}>
          4. Yarn Calculation
        </div>
        <ArrowRight className="ai-workflow-arrow" size={14} />
        <div className={`ai-workflow-step ${selectedDesign?.status === 'Approved' ? 'completed' : (selectedDesign?.total_kg > 0 || form.total_kg > 0) ? 'active' : 'pending'}`}>
          5. Verify & Save
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="ai-stats-grid">
        <div className="ai-stat-card" style={{ '--stat-gradient': 'linear-gradient(90deg, #4f46e5, #818cf8)' }}>
          <div className="icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <Cpu size={20} />
          </div>
          <div>
            <h4>Weave Type</h4>
            <div className="value">{selectedDesign?.ai_detected_weave || form.weave_type || 'Plain'}</div>
          </div>
        </div>
        <div className="ai-stat-card" style={{ '--stat-gradient': 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }}>
          <div className="icon-wrap" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
            <Layers size={20} />
          </div>
          <div>
            <h4>Total Ends</h4>
            <div className="value">{form.total_ends || 0}</div>
          </div>
        </div>
        <div className="ai-stat-card" style={{ '--stat-gradient': 'linear-gradient(90deg, #10b981, #34d399)' }}>
          <div className="icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <RefreshCw size={20} />
          </div>
          <div>
            <h4>Warp Req.</h4>
            <div className="value">{selectedDesign?.warp_kg || 0} <span style={{ fontSize: 12 }}>kg</span></div>
          </div>
        </div>
        <div className="ai-stat-card" style={{ '--stat-gradient': 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}>
          <div className="icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <RefreshCw size={20} />
          </div>
          <div>
            <h4>Weft Req.</h4>
            <div className="value">{selectedDesign?.weft_kg || 0} <span style={{ fontSize: 12 }}>kg</span></div>
          </div>
        </div>
        <div className="ai-stat-card" style={{ '--stat-gradient': 'linear-gradient(90deg, #ec4899, #f472b6)' }}>
          <div className="icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
            <FileText size={20} />
          </div>
          <div>
            <h4>Status</h4>
            <div className={`ai-status-badge ${form.status.toLowerCase()}`} style={{ marginTop: 2 }}>
              {form.status}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="split-view">
        {/* Left Pane: Saved Designs */}
        <div className="split-list" style={{ width: '320px', flexShrink: 0 }}>
          <div className="list-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Saved Designs</h3>
            <span className="badge" style={{ fontSize: 11 }}>{designs.length} Total</span>
          </div>
          <div className="list-body">
            {designs.map(d => (
              <div
                key={d.id}
                className={`list-item ${selectedDesign?.id === d.id ? 'active' : ''}`}
                onClick={() => handleSelectDesign(d)}
                style={{ padding: '14px 20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.design_no}</span>
                  <span className={`ai-status-badge ${d.status.toLowerCase()}`}>{d.status}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.design_name || 'Unnamed Design'}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Weave: {d.weave_type || 'Plain'}</span>
                  {d.total_kg > 0 && <span>Weight: {d.total_kg} kg</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Active Form & AI Vision Panel */}
        <div className="split-form" style={{ flexGrow: 1, minWidth: 0 }}>
          {(!selectedDesign && !form.image_path) ? (
            <div className="ai-initial-upload-container" style={{ padding: '60px 40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center', boxShadow: 'var(--shadow-sm)', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div className="ai-upload-zone" onClick={triggerFileInput} style={{ padding: '60px 40px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', width: '100%', maxWidth: '600px', transition: 'border-color 0.2s' }}>
                <div className="upload-icon" style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {analyzing ? (
                    <Cpu size={40} className="ai-analyzing" />
                  ) : (
                    <Upload size={40} />
                  )}
                </div>
                {analyzing ? (
                  <>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Analyzing Fabric Image...</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Running color clustering, stripe width repeat analysis and FFT weave detection.</p>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>Upload Fabric Image to Start AI-Assisted Design</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>Drag & drop or click to browse. Supported formats: PNG, JPG, JPEG.</p>
                    <button className="btn btn-primary" type="button" style={{ pointerEvents: 'none' }}>
                      <Upload size={16} /> Choose Image
                    </button>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                accept="image/*"
              />
            </div>
          ) : (
            <form className="ai-form-container" onSubmit={handleSave}>
            <div className="ai-form-header">
              <h2>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                {selectedDesign ? `Edit Design: ${selectedDesign.design_no}` : 'New AI Textile Design'}
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                {selectedDesign && (
                  <>
                    {form.status === 'Draft' && (
                      <button type="button" className="btn btn-secondary" onClick={() => handleStatusChange('Verified')}>
                        Verify
                      </button>
                    )}
                    {form.status === 'Verified' && (
                      <button type="button" className="btn btn-success" onClick={() => handleStatusChange('Approved')}>
                        Approve
                      </button>
                    )}
                    <button type="button" className="btn btn-danger" onClick={handleDelete}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={15} /> {selectedDesign ? 'Update Design' : 'Save Design'}
                </button>
              </div>
            </div>

            {/* Design Tabs */}
            <div className="ai-form-tabs">
              <button
                type="button"
                className={`ai-form-tab ${activeTab === 'header' ? 'active' : ''}`}
                onClick={() => setActiveTab('header')}
              >
                1. Design Specifications
              </button>
              <button
                type="button"
                className={`ai-form-tab ${activeTab === 'warp' ? 'active' : ''}`}
                onClick={() => setActiveTab('warp')}
              >
                2. Warp Grid ({form.warp_items.length})
              </button>
              <button
                type="button"
                className={`ai-form-tab ${activeTab === 'weft' ? 'active' : ''}`}
                onClick={() => setActiveTab('weft')}
              >
                3. Weft Grid ({form.weft_items.length})
              </button>
              <button
                type="button"
                className={`ai-form-tab ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                4. AI Vision & FFT Analysis
              </button>
            </div>

            <div className="ai-form-body">
              {/* Tab 1: Design Header Specs */}
              {activeTab === 'header' && (
                <div>
                  <h3 className="ai-section-title">Fabric Structure & Parameters</h3>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
                    <div className="form-group">
                      <label>Design Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="design_name"
                        value={form.design_name}
                        onChange={handleChange}
                        placeholder="e.g. Cotton Blue Stripe"
                      />
                    </div>
                    <div className="form-group">
                      <label>Weave Type</label>
                      <select
                        className="form-control"
                        name="weave_type"
                        value={form.weave_type}
                        onChange={handleChange}
                      >
                        <option value="Plain">Plain</option>
                        <option value="Twill">Twill</option>
                        <option value="Satin">Satin</option>
                        <option value="Dobby">Dobby</option>
                        <option value="Jacquard">Jacquard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Loom Width (inches)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="loom_width"
                        value={form.loom_width}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Finished Width (inches)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="finished_width"
                        value={form.finished_width}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
                    <div className="form-group">
                      <label>Reed</label>
                      <input
                        type="number"
                        className="form-control"
                        name="reed"
                        value={form.reed}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Pick</label>
                      <input
                        type="number"
                        className="form-control"
                        name="pick"
                        value={form.pick}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>EPI (Ends/inch)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="epi"
                        value={form.epi}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>PPI (Picks/inch)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="ppi"
                        value={form.ppi}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
                    <div className="form-group">
                      <label>Total Ends (Warp)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="total_ends"
                        value={form.total_ends}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Picks (Weft)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="total_picks"
                        value={form.total_picks}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fabric Length (meters)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="fabric_length"
                        value={form.fabric_length}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Created By</label>
                      <input
                        type="text"
                        className="form-control"
                        name="created_by"
                        value={form.created_by}
                        onChange={handleChange}
                        placeholder="Designer Name"
                      />
                    </div>
                  </div>

                  <h3 className="ai-section-title">Wastage Allowances</h3>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group">
                      <label>Warp Wastage %</label>
                      <input
                        type="number"
                        className="form-control"
                        name="warp_wastage_pct"
                        value={form.warp_wastage_pct}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Weft Wastage %</label>
                      <input
                        type="number"
                        className="form-control"
                        name="weft_wastage_pct"
                        value={form.weft_wastage_pct}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Warp Grid */}
              {activeTab === 'warp' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="ai-section-title" style={{ margin: 0, border: 'none' }}>Warp Yarn Repeat Pattern</h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={autofillFromAI}>
                        <Cpu size={14} /> Auto-fill from AI Analysis
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addWarpRow}>
                        <Plus size={14} /> Add Row
                      </button>
                    </div>
                  </div>

                  <table className="ai-design-grid">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>SNo</th>
                        <th>Yarn Count</th>
                        <th>Color Name / Shade</th>
                        <th>No of Threads</th>
                        <th>Ratio %</th>
                        <th>Req Weight (kg)</th>
                        <th style={{ width: '60px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.warp_items.map((item, index) => (
                        <tr key={index}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.sno}</td>
                          <td>
                            <input
                              type="text"
                              value={item.yarn_count}
                              onChange={(e) => handleWarpChange(index, 'yarn_count', e.target.value)}
                              placeholder="e.g. 2/40S"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.color}
                              onChange={(e) => handleWarpChange(index, 'color', e.target.value)}
                              placeholder="e.g. Navy Blue"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.threads}
                              onChange={(e) => handleWarpChange(index, 'threads', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.ratio_pct}
                              onChange={(e) => handleWarpChange(index, 'ratio_pct', e.target.value)}
                            />
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                            {item.req_kg || 0} kg
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button type="button" className="btn-icon" onClick={() => removeWarpRow(index)} style={{ color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {form.warp_items.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                            No warp repeat data entered yet. Click "Add Row" or "Auto-fill from AI".
                          </td>
                        </tr>
                      )}
                      {form.warp_items.length > 0 && (
                        <tr className="ai-grid-total-row">
                          <td colSpan="3">Total Warp Specification</td>
                          <td>{form.warp_items.reduce((sum, item) => sum + (item.threads || 0), 0)}</td>
                          <td>{form.warp_items.reduce((sum, item) => sum + (item.ratio_pct || 0), 0).toFixed(1)}%</td>
                          <td>{selectedDesign?.warp_kg || 0} kg</td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" className="btn btn-primary" onClick={runYarnCalculation} disabled={loading}>
                      <RefreshCw size={14} /> Calculate Requirements
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Weft Grid */}
              {activeTab === 'weft' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="ai-section-title" style={{ margin: 0, border: 'none' }}>Weft Yarn Insertion Pattern</h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={autofillFromAI}>
                        <Cpu size={14} /> Auto-fill from AI Analysis
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addWeftRow}>
                        <Plus size={14} /> Add Row
                      </button>
                    </div>
                  </div>

                  <table className="ai-design-grid">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>SNo</th>
                        <th>Yarn Count</th>
                        <th>Color Name / Shade</th>
                        <th>No of Picks / Threads</th>
                        <th>Ratio %</th>
                        <th>Req Weight (kg)</th>
                        <th style={{ width: '60px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.weft_items.map((item, index) => (
                        <tr key={index}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.sno}</td>
                          <td>
                            <input
                              type="text"
                              value={item.yarn_count}
                              onChange={(e) => handleWeftChange(index, 'yarn_count', e.target.value)}
                              placeholder="e.g. 30S"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.color}
                              onChange={(e) => handleWeftChange(index, 'color', e.target.value)}
                              placeholder="e.g. Off White"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.threads}
                              onChange={(e) => handleWeftChange(index, 'threads', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.ratio_pct}
                              onChange={(e) => handleWeftChange(index, 'ratio_pct', e.target.value)}
                            />
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                            {item.req_kg || 0} kg
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button type="button" className="btn-icon" onClick={() => removeWeftRow(index)} style={{ color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {form.weft_items.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                            No weft repeat data entered yet. Click "Add Row" or "Auto-fill from AI".
                          </td>
                        </tr>
                      )}
                      {form.weft_items.length > 0 && (
                        <tr className="ai-grid-total-row">
                          <td colSpan="3">Total Weft Specification</td>
                          <td>{form.weft_items.reduce((sum, item) => sum + (item.threads || 0), 0)}</td>
                          <td>{form.weft_items.reduce((sum, item) => sum + (item.ratio_pct || 0), 0).toFixed(1)}%</td>
                          <td>{selectedDesign?.weft_kg || 0} kg</td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" className="btn btn-primary" onClick={runYarnCalculation} disabled={loading}>
                      <RefreshCw size={14} /> Calculate Requirements
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: AI Analysis Results */}
              {activeTab === 'results' && (
                <div>
                  <h3 className="ai-section-title">Fabric Scan & AI Vision Model</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                    {/* Left side: Upload image zone */}
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Fabric Sample Image</h4>
                      {(selectedDesign?.image_path || form.image_path) ? (
                        <div>
                          <div className="ai-image-preview">
                            <img
                              src={`http://localhost:8000${selectedDesign?.image_path || form.image_path}`}
                              alt="Fabric Scan Preview"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={triggerFileInput}>
                              <Upload size={14} /> Change Image
                            </button>
                            <button
                              type="button"
                              className={`btn btn-primary btn-sm ${analyzing ? 'ai-analyzing' : ''}`}
                              onClick={runAIAnalysis}
                              disabled={analyzing}
                            >
                              <Cpu size={14} /> {analyzing ? 'Analyzing with AI...' : 'Run AI Analysis'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="ai-upload-zone" onClick={triggerFileInput}>
                          <div className="upload-icon">
                            <Upload size={28} />
                          </div>
                          <h4>Click to Upload Fabric Sample</h4>
                          <p>Supports PNG, JPG, JPEG up to 10MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        accept="image/*"
                      />
                    </div>

                    {/* Right side: AI Results analysis output */}
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Analysis Engine Output</h4>
                      {(selectedDesign?.ai_analysis_status === 'completed' || form.ai_analysis_status === 'completed') ? (
                        <div className="ai-results-panel">
                          <h3 style={{ margin: 0, fontSize: 15 }}>
                            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                            Analysis Report
                          </h3>

                          {/* Weave Detection */}
                          <div style={{ margin: '16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Classified Weave Structure:</span>
                              <strong style={{ color: 'var(--primary)' }}>{selectedDesign?.ai_detected_weave || form.ai_detected_weave}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Model Confidence Level:</span>
                              <strong>{(((selectedDesign?.ai_confidence || form.ai_confidence || 0) * 100)).toFixed(1)}%</strong>
                            </div>
                          </div>

                          {/* Color Clusters */}
                          <div style={{ margin: '16px 0' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
                              Dominant Colors Detected (KMeans):
                            </span>
                            <div className="ai-color-swatches">
                              {(selectedDesign?.ai_color_clusters || form.ai_color_clusters)?.map((c, i) => (
                                <div key={i} className="ai-color-swatch">
                                  <div className="ai-color-circle" style={{ backgroundColor: c.hex }} />
                                  <div className="name">{c.color}</div>
                                  <div className="pct">{c.ratio}%</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Stripe Repeat visualization */}
                          {(selectedDesign?.ai_stripe_repeat || form.ai_stripe_repeat) && (selectedDesign?.ai_stripe_repeat || form.ai_stripe_repeat).length > 0 && (
                            <div style={{ margin: '16px 0' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                                Stripe Repeat Pattern Profile:
                              </span>
                              <div className="ai-stripe-preview">
                                {(selectedDesign?.ai_stripe_repeat || form.ai_stripe_repeat).map((colorName, idx) => {
                                  // Find swatch for color to get hex value
                                  const hex = (selectedDesign?.ai_color_clusters || form.ai_color_clusters)?.find(c => c.color === colorName.toLowerCase())?.hex || '#ccc';
                                  return (
                                    <div
                                      key={idx}
                                      className="ai-stripe-bar"
                                      style={{
                                        backgroundColor: hex,
                                        flexGrow: 1,
                                        height: '100%'
                                      }}
                                      title={colorName}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* FFT Frequency profile stats */}
                          {(selectedDesign?.ai_fft_profile || form.ai_fft_profile) && (
                            <div style={{ margin: '16px 0 0 0' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block' }}>
                                FFT Frequency Spectrum Statistics:
                              </span>
                              <div className="ai-fft-info">
                                <div className="ai-fft-item">
                                  <div className="label">H-Peaks</div>
                                  <div className="value">{(selectedDesign?.ai_fft_profile || form.ai_fft_profile).h_peaks || 0}</div>
                                </div>
                                <div className="ai-fft-item">
                                  <div className="label">V-Peaks</div>
                                  <div className="value">{(selectedDesign?.ai_fft_profile || form.ai_fft_profile).v_peaks || 0}</div>
                                </div>
                                <div className="ai-fft-item">
                                  <div className="label">Cross Ratio</div>
                                  <div className="value">{((selectedDesign?.ai_fft_profile || form.ai_fft_profile).cross_ratio || 0).toFixed(3)}</div>
                                </div>
                                <div className="ai-fft-item">
                                  <div className="label">Diag Avg</div>
                                  <div className="value">{((selectedDesign?.ai_fft_profile || form.ai_fft_profile).diag_avg || 0).toFixed(3)}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Autofill CTA */}
                          <div style={{ marginTop: 24 }}>
                            <button type="button" className="btn btn-success btn-block" onClick={autofillFromAI}>
                              <Cpu size={16} /> Load AI Data into Warp/Weft grids
                            </button>
                          </div>
                        </div>
                      ) : (selectedDesign?.ai_analysis_status === 'pending' || form.ai_analysis_status === 'pending' || analyzing) ? (
                        <div className="ai-results-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
                          <Cpu size={36} className="ai-analyzing" style={{ color: 'var(--primary)', marginBottom: 12 }} />
                          <p style={{ fontWeight: 600 }}>AI Vision Engine is analyzing the fabric structure...</p>
                          <p className="text-muted" style={{ fontSize: 12 }}>Running color clustering and 2D FFT weave classification.</p>
                        </div>
                      ) : (
                        <div className="ai-results-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
                          <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                          <p className="text-muted" style={{ fontSize: 13 }}>No analysis data available. Please upload a fabric image and click "Run AI Analysis".</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form footer containing calculated yarn weight summary */}
            {/* Form footer containing calculated yarn weight summary */}
            {(selectedDesign || form.warp_kg > 0 || form.weft_kg > 0) && (
              <div
                className="ai-form-header"
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(8, 145, 178, 0.05))',
                  borderTop: '1px solid var(--border)',
                  borderBottom: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Yarn Calculation Summary:</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Warp: <strong>{selectedDesign?.warp_kg || form.warp_kg || 0} kg</strong> | Weft: <strong>{selectedDesign?.weft_kg || form.weft_kg || 0} kg</strong>
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                    Total Yarn Req: {selectedDesign?.total_kg || form.total_kg || 0} kg
                  </span>
                </div>
              </div>
            )}
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
