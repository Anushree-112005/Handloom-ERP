import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calculator, Plus, Search, Download, ArrowLeft, Save, 
  Trash2, Eye, CheckCircle, IndianRupee, RefreshCw, X, AlertTriangle, FileText, Edit2, Filter
} from 'lucide-react';
import { 
  costingSheetAPI, buyerOrderAPI, yarnRateMasterAPI, washTypeMasterAPI, 
  constructionMasterAPI, wastageMasterAPI 
} from '../../services/api';
import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

import {
    calculateTotalEnds, calculateWarpGLM, calculateWeftGLM, calculateGSM,
    calculateOunce, calculateYarnWeight, calculateYarnCost, calculateWarping,
    calculateWeaving, calculateWashing, calculateSellingPrice, calculateProfit, calculateBeamQuantity
} from '../../utils/costingCalculations';

const STEPS = [
  { id: 'header', label: '1. Header' },
  { id: 'construction', label: '2. Construction' },
  { id: 'yarn', label: '3. Yarn & Colours' },
  { id: 'warping', label: '4. Warping & Weaving' },
  { id: 'washing', label: '5. Washing' },
  { id: 'summary', label: '6. Summary' }
];

export default function CostingSheetModule() {
  const [view, setView] = useState('list'); // 'list' | 'form' | 'view'
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [selectedViewSheet, setSelectedViewSheet] = useState(null);
  
  // Masters
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [yarnRates, setYarnRates] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [constructions, setConstructions] = useState([]);
  const [wastages, setWastages] = useState([]);

  // Form State
  const [currentStep, setCurrentStep] = useState('header');
  const [formData, setFormData] = useState(getInitialState());
  const [validationErrors, setValidationErrors] = useState({});

  function getInitialState() {
    return {
      costing_no: '', buyer: '', buyer_order: '', construction: '', po_quantity: 0,
      costing_date: new Date().toISOString().split('T')[0], status: 'Draft',
      estimated_cost: 0, actual_cost: 0, selling_price: 0, profit_margin_pct: 0, profit_value: 0,
      construction_details: {
        warp_count_1: '', warp_count_2: '', warp_rate_1: 0, warp_rate_2: 0, warp_crimp_pct: 0, seer: 0,
        weft_count: '', weft_rate: 0, weft_crimp_pct: 0,
        finish_epi: 0, finish_ppi: 0, finish_width: 0,
        greige_epi: 0, greige_width: 0, reed: 0, reed_space: 0,
        total_ends: 0, weft_length: 0, warp_glm: 0, weft_glm: 0, gsm: 0, oz_yd2: 0
      },
      yarn_lines: [],
      warping_details: { warping_rate_1: 0, warping_rate_2: 0, sizing_rate_1: 0, sizing_rate_2: 0, pick_rate: 0, warping_cost: 0, sizing_cost: 0, weaving_cost: 0, actual_weaving_cost: 0 },
      washing_details: { wash_type: '', rate: 0, shrinkage_pct: 0, washing_cost: 0, washed_fabric_cost: 0 },
      summary: { unwash_fabric_cost: 0, washed_fabric_cost: 0, greige_yarn_cost: 0, dyed_yarn_cost: 0, warping_cost: 0, sizing_cost: 0, weaving_cost: 0, washing_cost: 0, greige_quantity: 0, beam_quantity: 0, warp_1_beam: 0, warp_2_beam: 0 }
    };
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shRes, boRes, yrRes, wtRes, csRes, wsRes] = await Promise.all([
        costingSheetAPI.list(),
        buyerOrderAPI.list(),
        yarnRateMasterAPI.list().catch(()=>({data:[]})),
        washTypeMasterAPI.list().catch(()=>({data:[]})),
        constructionMasterAPI.list().catch(()=>({data:[]})),
        wastageMasterAPI.list().catch(()=>({data:[]}))
      ]);
      setSheets(shRes.data || []);
      setBuyerOrders(boRes.data || []);
      setYarnRates(yrRes.data || []);
      setWashTypes(wtRes.data || []);
      setConstructions(csRes.data || []);
      setWastages(wsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Costing Sheets Report", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Costing No', 'Buyer', 'Construction', 'Estimated Cost', 'Margin %', 'Status']],
      body: sheets.map(s => [s.costing_no, s.buyer, s.construction, s.estimated_cost?.toFixed(2) || 0, (s.profit_margin_pct?.toFixed(1) || 0) + '%', s.status]),
    });
    doc.save("Costing_Sheets_Report.pdf");
  };

  const generateExcel = () => {
    const data = sheets.map(s => ({
      'Costing No': s.costing_no,
      'Buyer': s.buyer,
      'Construction': s.construction,
      'Estimated Cost': s.estimated_cost,
      'Margin %': s.profit_margin_pct,
      'Status': s.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Costing Sheets");
    XLSX.writeFile(wb, "Costing_Sheets_Report.xlsx");
  };

  // ---------------- FORM HANDLING ----------------
  const handleEdit = (s) => {
    setFormData({
      ...getInitialState(),
      ...s,
      construction_details: { ...getInitialState().construction_details, ...(s.construction_details || {}) },
      warping_details: { ...getInitialState().warping_details, ...(s.warping_details || {}) },
      washing_details: { ...getInitialState().washing_details, ...(s.washing_details || {}) },
      summary: { ...getInitialState().summary, ...(s.summary || {}) },
      yarn_lines: s.yarn_lines || [],
      costing_no: s.costing_no || '',
      buyer: s.buyer || '',
      buyer_order: s.buyer_order || '',
      construction: s.construction || '',
      po_quantity: s.po_quantity || 0,
      costing_date: s.costing_date || new Date().toISOString().split('T')[0],
      status: s.status || 'Draft',
    });
    setView('form');
  };

  const runCalculations = (data) => {
    let d = { ...data };
    let c = d.construction_details;
    let w = d.warping_details;
    let ws = d.washing_details;
    let s = d.summary;
    let q = parseFloat(d.po_quantity) || 0;

    // Stage 1: Construction
    c.total_ends = calculateTotalEnds(c.greige_epi, c.greige_width);
    c.warp_glm = calculateWarpGLM(c.total_ends, c.warp_count_1, c.warp_count_2, c.warp_crimp_pct);
    c.weft_glm = calculateWeftGLM(c.finish_ppi, c.greige_width, c.weft_count, c.weft_crimp_pct);
    c.gsm = calculateGSM(c.warp_glm, c.weft_glm, c.finish_width);
    c.oz_yd2 = calculateOunce(c.gsm);

    // Stage 2: Yarn Lines
    let greige_yarn_cost = 0;
    let dyed_yarn_cost = 0;
    d.yarn_lines = d.yarn_lines.map(yl => {
        const line = {...yl};
        const glm = line.yarn_type === 'Weft' ? c.weft_glm : c.warp_glm;
        const baseKg = calculateYarnWeight(glm, q) * (line.percentage / 100);
        line.ttl_kg = baseKg * (1 + (line.wastage_pct / 100)); // Simplified
        line.cost_m = calculateYarnCost(line.ttl_kg, line.rate_kg) / q;
        if (line.yarn_type === 'Weft') greige_yarn_cost += (line.cost_m * q);
        else dyed_yarn_cost += (line.cost_m * q);
        return line;
    });

    s.greige_yarn_cost = greige_yarn_cost;
    s.dyed_yarn_cost = dyed_yarn_cost;

    // Stage 3 & 4: Warping & Weaving
    w.warping_cost = calculateWarping(w.warping_rate_1, q);
    w.sizing_cost = (parseFloat(w.sizing_rate_1) || 0) * q;
    w.weaving_cost = calculateWeaving(w.pick_rate, c.finish_ppi, q);
    
    s.warping_cost = w.warping_cost;
    s.sizing_cost = w.sizing_cost;
    s.weaving_cost = w.weaving_cost;

    // Stage 5: Washing
    ws.washing_cost = calculateWashing(ws.rate, q);
    s.washing_cost = ws.washing_cost;
    
    // Unwash & Washed Cost
    s.unwash_fabric_cost = s.greige_yarn_cost + s.dyed_yarn_cost + s.warping_cost + s.sizing_cost + s.weaving_cost;
    s.washed_fabric_cost = s.unwash_fabric_cost + s.washing_cost;

    ws.washed_fabric_cost = s.washed_fabric_cost; // update wash tab too

    // Stage 6: Summary & Profit
    const totalEst = s.washed_fabric_cost;
    d.estimated_cost = totalEst;
    d.actual_cost = totalEst; // For now
    d.selling_price = calculateSellingPrice(totalEst, d.profit_margin_pct);
    d.profit_value = calculateProfit(d.selling_price, totalEst);

    setFormData(d);
  };

  const handleCreate = () => {
    setFormData(getInitialState());
    setCurrentStep('header');
    setView('form');
  };

  const handleSave = async (status = 'Draft') => {
    // Validation
    if (!formData.buyer || !formData.construction || formData.po_quantity <= 0) {
        alert("Please fill mandatory fields: Buyer, Construction, and PO Quantity");
        return;
    }
    const totalColorPct = formData.yarn_lines.reduce((acc, y) => acc + (parseFloat(y.percentage) || 0), 0);
    if (formData.yarn_lines.length > 0 && Math.abs(totalColorPct - 100) > 0.1 && (formData.yarn_lines.some(yl => yl.yarn_type !== 'Weft'))) {
        // Weft can have different % but warp should total 100% per type (simplified logic here, ideally group by type)
    }

    try {
      const payload = { ...formData, status };
      if (formData.id) {
        await costingSheetAPI.update(formData.id, payload);
      } else {
        await costingSheetAPI.create(payload);
      }
      fetchData();
      setView('list');
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save costing sheet.");
    }
  };

  const updateField = (section, field, value) => {
      if (section === 'root') {
          setFormData(prev => { const nd = {...prev, [field]: value}; runCalculations(nd); return nd; });
      } else {
          setFormData(prev => { 
              const nd = {...prev, [section]: {...prev[section], [field]: value}}; 
              runCalculations(nd); 
              return nd; 
          });
      }
  };

  // ---------------- UI RENDERS ----------------

  const renderSummaryPanel = () => {
      const s = formData.summary || { unwash_fabric_cost: 0, washed_fabric_cost: 0 };
      return (
          <div style={{ width: '300px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', padding: '24px', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, marginBottom: 16 }}>Live Summary</h3>
              <div className="card" style={{ padding: 16, background: '#f8fafc', borderLeft: '4px solid #64748b' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unwash Cost</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}><IndianRupee size={16}/> {(s.unwash_fabric_cost || 0).toFixed(2)}</div>
              </div>
              <div className="card" style={{ padding: 16, background: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Washed Cost</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}><IndianRupee size={16}/> {(s.washed_fabric_cost || 0).toFixed(2)}</div>
              </div>
              <div className="card" style={{ padding: 16, background: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selling Price</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}><IndianRupee size={16}/> {(formData.selling_price || 0).toFixed(2)}</div>
              </div>
              <div className="card" style={{ padding: 16, background: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Profit</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}><IndianRupee size={16}/> {(formData.profit_value || 0).toFixed(2)}</div>
              </div>
          </div>
      );
  };

  const renderHeaderStep = () => (
    <div className="animate-fade">
        <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>General Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            <div className="form-group">
                <label>Costing Number</label>
                <input type="text" className="form-control" disabled value={formData.costing_no || 'Auto Generated'} style={{ background: '#f1f5f9' }} />
            </div>
            <div className="form-group">
                <label>Costing Date</label>
                <input type="date" className="form-control" value={formData.costing_date} onChange={e => updateField('root', 'costing_date', e.target.value)} />
            </div>
            <div className="form-group">
                <label>Buyer Order <span style={{color:'red'}}>*</span></label>
                <select className="form-control" value={formData.buyer_order || ''} onChange={e => {
                    const bo = buyerOrders.find(b => b.ibpo_number === e.target.value);
                    if (bo) {
                        setFormData(p => { 
                            const nd = {...p, buyer_order: bo.ibpo_number, buyer: bo.buyer_name || bo.party_name};
                            runCalculations(nd); return nd;
                        });
                    }
                }}>
                    <option value="">Select Buyer Order</option>
                    {buyerOrders.map(bo => <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} - {bo.buyer_name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>Buyer <span style={{color:'red'}}>*</span></label>
                <input type="text" className="form-control" value={formData.buyer || ''} onChange={e => updateField('root', 'buyer', e.target.value)} />
            </div>
            <div className="form-group">
                <label>Construction <span style={{color:'red'}}>*</span></label>
                <select className="form-control" value={formData.construction || ''} onChange={e => {
                    const c = constructions.find(x => x.construction === e.target.value);
                    if(c) {
                        setFormData(p => {
                            const nd = {...p, construction: c.construction, construction_details: {...p.construction_details, greige_epi: c.epi, finish_ppi: c.ppi, finish_width: c.width}};
                            runCalculations(nd); return nd;
                        });
                    } else {
                        updateField('root', 'construction', e.target.value);
                    }
                }}>
                    <option value="">Select Construction</option>
                    {constructions.map(c => <option key={c.id} value={c.construction}>{c.construction}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>PO Quantity (Mtrs) <span style={{color:'red'}}>*</span></label>
                <input type="number" className="form-control" value={formData.po_quantity || 0} onChange={e => updateField('root', 'po_quantity', parseFloat(e.target.value)||0)} />
            </div>
            <div className="form-group">
                <label>Status</label>
                <input type="text" className="form-control" disabled value={formData.status} style={{ background: '#f1f5f9' }} />
            </div>
        </div>
    </div>
  );

  const renderConstructionStep = () => {
    const c = formData.construction_details;
    return (
    <div className="animate-fade">
        <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabric Construction</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
                <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>Warp Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    <div className="form-group"><label>Warp Count 1</label><input type="text" className="form-control" value={c.warp_count_1} onChange={e => updateField('construction_details', 'warp_count_1', e.target.value)} /></div>
                    <div className="form-group"><label>Warp Count 2</label><input type="text" className="form-control" value={c.warp_count_2} onChange={e => updateField('construction_details', 'warp_count_2', e.target.value)} /></div>
                    <div className="form-group"><label>Warp Rate 1</label><input type="number" className="form-control" value={c.warp_rate_1} onChange={e => updateField('construction_details', 'warp_rate_1', parseFloat(e.target.value)||0)} /></div>
                    <div className="form-group"><label>Warp Rate 2</label><input type="number" className="form-control" value={c.warp_rate_2} onChange={e => updateField('construction_details', 'warp_rate_2', parseFloat(e.target.value)||0)} /></div>
                    <div className="form-group"><label>Warp Crimp %</label><input type="number" className="form-control" value={c.warp_crimp_pct} onChange={e => updateField('construction_details', 'warp_crimp_pct', parseFloat(e.target.value)||0)} /></div>
                    <div className="form-group"><label>Seer</label><input type="number" className="form-control" value={c.seer} onChange={e => updateField('construction_details', 'seer', parseFloat(e.target.value)||0)} /></div>
                </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
                <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>Weft Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    <div className="form-group"><label>Weft Count</label><input type="text" className="form-control" value={c.weft_count} onChange={e => updateField('construction_details', 'weft_count', e.target.value)} /></div>
                    <div className="form-group"><label>Weft Rate</label><input type="number" className="form-control" value={c.weft_rate} onChange={e => updateField('construction_details', 'weft_rate', parseFloat(e.target.value)||0)} /></div>
                    <div className="form-group"><label>Weft Crimp %</label><input type="number" className="form-control" value={c.weft_crimp_pct} onChange={e => updateField('construction_details', 'weft_crimp_pct', parseFloat(e.target.value)||0)} /></div>
                </div>
            </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>Specifications</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div className="form-group"><label>Greige EPI</label><input type="number" className="form-control" value={c.greige_epi} onChange={e => updateField('construction_details', 'greige_epi', parseFloat(e.target.value)||0)} /></div>
                <div className="form-group"><label>Greige Width</label><input type="number" className="form-control" value={c.greige_width} onChange={e => updateField('construction_details', 'greige_width', parseFloat(e.target.value)||0)} /></div>
                <div className="form-group"><label>Finish EPI</label><input type="number" className="form-control" value={c.finish_epi} onChange={e => updateField('construction_details', 'finish_epi', parseFloat(e.target.value)||0)} /></div>
                <div className="form-group"><label>Finish PPI</label><input type="number" className="form-control" value={c.finish_ppi} onChange={e => updateField('construction_details', 'finish_ppi', parseFloat(e.target.value)||0)} /></div>
                <div className="form-group"><label>Finish Width</label><input type="number" className="form-control" value={c.finish_width} onChange={e => updateField('construction_details', 'finish_width', parseFloat(e.target.value)||0)} /></div>
                <div className="form-group"><label>Reed</label><input type="number" className="form-control" value={c.reed} onChange={e => updateField('construction_details', 'reed', parseFloat(e.target.value)||0)} /></div>
                <div className="form-group"><label>Reed Space</label><input type="number" className="form-control" value={c.reed_space} onChange={e => updateField('construction_details', 'reed_space', parseFloat(e.target.value)||0)} /></div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            {[{l:'Total Ends', v:c.total_ends}, {l:'Weft Length', v:c.weft_length}, {l:'Warp GLM', v:c.warp_glm}, {l:'Weft GLM', v:c.weft_glm}, {l:'GSM', v:c.gsm}, {l:'OZ/YD²', v:c.oz_yd2}].map(item => (
                <div key={item.l} className="card" style={{ padding: 16, background: '#f8fafc', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{item.v.toFixed(2)}</div>
                </div>
            ))}
        </div>
    </div>
  )};

    const renderYarnStep = () => {
    const updateLine = (idx, field, val) => {
        setFormData(p => {
            const nLines = [...p.yarn_lines];
            nLines[idx][field] = val;
            const nd = {...p, yarn_lines: nLines};
            runCalculations(nd); return nd;
        });
    };
    
    const renderYarnGroup = (yarnType) => {
        const lines = formData.yarn_lines.map((yl, i) => ({...yl, globalIndex: i})).filter(yl => yl.yarn_type === yarnType);
        return (
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h5 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{yarnType}</h5>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => {
                        setFormData(p => {
                            const nd = {...p, yarn_lines: [...p.yarn_lines, { yarn_type: yarnType, color: '', percentage: yarnType === 'Weft' ? 100 : 100, ends_picks: 0, rate_kg: 0, wastage_pct: 0, ttl_kg: 0, cost_m: 0 }]};
                            runCalculations(nd); return nd;
                        });
                    }}><Plus size={14} style={{marginRight: 4}}/> Add Colour</button>
                </div>
                {lines.length > 0 ? (
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Yarn Template</th><th>Colour</th><th>%</th><th>Ends/Picks</th>
                                <th>Rate/KG</th><th>Wastage %</th><th>TTL KG</th><th>Cost/M</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((yl) => {
                                const idx = yl.globalIndex;
                                return (
                                    <tr key={idx}>
                                        <td>
                                            <select className="form-control" style={{padding: '4px 8px', height: 32, width: 140}} 
                                                onChange={e => {
                                                    const sel = yarnRates.find(y => y.id === parseInt(e.target.value));
                                                    if (sel) {
                                                        setFormData(p => {
                                                            const nLines = [...p.yarn_lines];
                                                            nLines[idx].color = sel.color;
                                                            nLines[idx].rate_kg = sel.rate_per_kg;
                                                            const nd = {...p, yarn_lines: nLines};
                                                            runCalculations(nd); return nd;
                                                        });
                                                    }
                                                }}>
                                                <option value="">Custom / Manual</option>
                                                {yarnRates.map(yr => (
                                                    <option key={yr.id} value={yr.id}>{yr.yarn_count} - {yr.color} ({yr.rate_per_kg}/kg)</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td><input type="text" className="form-control" style={{padding: '4px 8px', height: 32, width: 100}} value={yl.color} onChange={e=>updateLine(idx,'color',e.target.value)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 60}} value={yl.percentage} onChange={e=>updateLine(idx,'percentage',parseFloat(e.target.value)||0)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 80}} value={yl.ends_picks} onChange={e=>updateLine(idx,'ends_picks',parseFloat(e.target.value)||0)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 80}} value={yl.rate_kg} onChange={e=>updateLine(idx,'rate_kg',parseFloat(e.target.value)||0)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 80}} value={yl.wastage_pct} onChange={e=>updateLine(idx,'wastage_pct',parseFloat(e.target.value)||0)}/></td>
                                        <td>{(yl.ttl_kg||0).toFixed(2)}</td>
                                        <td>{(yl.cost_m||0).toFixed(2)}</td>
                                        <td><button className="btn btn-secondary" style={{padding: '4px 8px'}} onClick={() => {
                                            setFormData(p => { const nd = {...p, yarn_lines: p.yarn_lines.filter((_,i)=>i!==idx)}; runCalculations(nd); return nd; });
                                        }}><Trash2 size={14}/></button></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 14 }}>No colours added. Click "+ Add Colour" to specify yarn blend.</div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-fade">
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn & Colours</h4>
            {renderYarnGroup('Warp 1')}
            {renderYarnGroup('Warp 2')}
            {renderYarnGroup('Weft')}
        </div>
    );
  };

  const renderWarpingStep = () => {
    const w = formData.warping_details;
    return (
        <div className="animate-fade">
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Warping & Weaving</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>Warping & Sizing Rates</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                        <div className="form-group"><label>Warping Rate 1</label><input type="number" className="form-control" value={w.warping_rate_1} onChange={e => updateField('warping_details', 'warping_rate_1', parseFloat(e.target.value)||0)} /></div>
                        <div className="form-group"><label>Warping Rate 2</label><input type="number" className="form-control" value={w.warping_rate_2} onChange={e => updateField('warping_details', 'warping_rate_2', parseFloat(e.target.value)||0)} /></div>
                        <div className="form-group"><label>Sizing Rate 1</label><input type="number" className="form-control" value={w.sizing_rate_1} onChange={e => updateField('warping_details', 'sizing_rate_1', parseFloat(e.target.value)||0)} /></div>
                        <div className="form-group"><label>Sizing Rate 2</label><input type="number" className="form-control" value={w.sizing_rate_2} onChange={e => updateField('warping_details', 'sizing_rate_2', parseFloat(e.target.value)||0)} /></div>
                    </div>
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>Weaving Rates</h4>
                    <div className="form-group"><label>Pick Rate</label><input type="number" className="form-control" value={w.pick_rate} onChange={e => updateField('warping_details', 'pick_rate', parseFloat(e.target.value)||0)} /></div>
                    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}><span>Calculated Warping Cost</span><span style={{ fontWeight: 'bold' }}>{w.warping_cost.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}><span>Calculated Sizing Cost</span><span style={{ fontWeight: 'bold' }}>{w.sizing_cost.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}><span>Calculated Weaving Cost</span><span style={{ fontWeight: 'bold' }}>{w.weaving_cost.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderWashingStep = () => {
    const ws = formData.washing_details;
    return (
        <div className="animate-fade">
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Washing</h4>
            <div className="card" style={{ padding: 20, maxWidth: 600 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label>Wash Type <span style={{color:'red'}}>*</span></label>
                    <select className="form-control" value={ws.wash_type} onChange={e => {
                        const type = washTypes.find(x => x.wash_type === e.target.value);
                        if(type) {
                            setFormData(p => { const nd = {...p, washing_details: {...p.washing_details, wash_type: type.wash_type, rate: type.rate_per_m, shrinkage_pct: type.shrinkage_pct}}; runCalculations(nd); return nd; });
                        } else {
                            updateField('washing_details', 'wash_type', e.target.value);
                        }
                    }}>
                        <option value="">Select Wash Type</option>
                        {washTypes.map(w => <option key={w.id} value={w.wash_type}>{w.wash_type}</option>)}
                    </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div className="form-group"><label>Rate / Mtr</label><input type="number" className="form-control" value={ws.rate} onChange={e => updateField('washing_details', 'rate', parseFloat(e.target.value)||0)} /></div>
                    <div className="form-group"><label>Shrinkage %</label><input type="number" className="form-control" value={ws.shrinkage_pct} onChange={e => updateField('washing_details', 'shrinkage_pct', parseFloat(e.target.value)||0)} /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 8 }}>
                    <span>Calculated Washing Cost</span><span style={{ fontWeight: 'bold', color: 'var(--primary)' }}><IndianRupee size={14}/> {ws.washing_cost.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                    <span>Total Washed Fabric Cost</span><span style={{ fontWeight: 'bold', color: '#22c55e' }}><IndianRupee size={14}/> {ws.washed_fabric_cost.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
  };

  const renderSummaryStep = () => {
    const s = formData.summary || { greige_yarn_cost: 0, dyed_yarn_cost: 0, warping_cost: 0, sizing_cost: 0, weaving_cost: 0, washing_cost: 0, washed_fabric_cost: 0 };
    return (
        <div className="animate-fade">
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Cost Summary & Profit</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>Cost Breakdown</h4>
                    <table className="table" style={{ width: '100%' }}>
                        <thead><tr><th>Component</th><th>Value (<IndianRupee size={12}/>)</th><th>Percentage</th></tr></thead>
                        <tbody>
                            {[
                                { c: 'Greige Yarn', v: s.greige_yarn_cost },
                                { c: 'Dyed Yarn', v: s.dyed_yarn_cost },
                                { c: 'Warping', v: s.warping_cost },
                                { c: 'Sizing', v: s.sizing_cost },
                                { c: 'Weaving', v: s.weaving_cost },
                                { c: 'Washing', v: s.washing_cost }
                            ].map((item, idx) => {
                                const pct = s.washed_fabric_cost ? (((item.v || 0) / s.washed_fabric_cost) * 100).toFixed(1) : 0;
                                return (
                                <tr key={idx}>
                                    <td>{item.c}</td>
                                    <td style={{ fontWeight: 600 }}>{(item.v || 0).toFixed(2)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 100, background: '#e2e8f0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%' }}></div>
                                            </div>
                                            <span style={{ fontSize: 12 }}>{pct}%</span>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>Margins</h4>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Target Margin %</label>
                        <input type="number" className="form-control" style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--primary)' }} value={formData.profit_margin_pct} onChange={e => updateField('root', 'profit_margin_pct', parseFloat(e.target.value)||0)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}><span>Target Selling Price</span><span style={{ fontWeight: 'bold' }}>{formData.selling_price.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Profit Value</span><span style={{ fontWeight: 'bold', color: formData.profit_value > 0 ? '#22c55e' : '#ef4444' }}>{formData.profit_value.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderActiveStep = () => {
    switch (currentStep) {
        case 'header': return renderHeaderStep();
        case 'construction': return renderConstructionStep();
        case 'yarn': return renderYarnStep();
        case 'warping': return renderWarpingStep();
        case 'washing': return renderWashingStep();
        case 'summary': return renderSummaryStep();
        default: return renderHeaderStep();
    }
  };

  // ---------------- MAIN RENDER ----------------
  if (view === 'form') {
      return (
        <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setView('list')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {formData.id ? `Edit Costing: ${formData.costing_no}` : 'New Costing Sheet'}
                        <span style={{
                            padding: '4px 12px', borderRadius: '12px', fontSize: '14px',
                            background: formData.status === 'Approved' ? '#dcfce7' : '#fef9c3',
                            color: formData.status === 'Approved' ? '#166534' : '#854d0e',
                            fontWeight: 600
                        }}>
                            {formData.status}
                        </span>
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => handleSave('Draft')}>
                        <Save size={16} /> Save Draft
                    </button>
                    <button className="btn btn-primary" onClick={() => handleSave('Pending Approval')}>
                        <CheckCircle size={16} /> Submit for Approval
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {STEPS.map(tab => (
              <button
                key={tab.id} onClick={(e) => { e.preventDefault(); setCurrentStep(tab.id); }}
                type="button"
                style={{
                  padding: '16px 24px', background: currentStep === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: currentStep === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: currentStep === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
             {renderActiveStep()}
             
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
                 <button type="button" className="btn btn-secondary" 
                     disabled={STEPS.findIndex(s => s.id === currentStep) === 0}
                     onClick={() => setCurrentStep(STEPS[STEPS.findIndex(s => s.id === currentStep) - 1].id)}>
                     Previous Section
                 </button>
                 <button type="button" className="btn btn-primary" 
                     disabled={STEPS.findIndex(s => s.id === currentStep) === STEPS.length - 1}
                     onClick={() => setCurrentStep(STEPS[STEPS.findIndex(s => s.id === currentStep) + 1].id)}>
                     Next Section
                 </button>
             </div>
          </div>
        </div>
        </div>
      );
  }

  // List View Matches Party Master Layout
  return (
    <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', margin: 0, color: 'var(--text-primary)' }}>
          <Calculator size={28} style={{ marginRight: 12, color: 'var(--primary)' }}/> 
          Costing Sheet Master
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: 600, borderRadius: 6 }}
            >
              <Download size={16} style={{ color: '#0f172a' }} /> Export
            </button>
            
            {showExportMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: 160,
                zIndex: 50,
                overflow: 'hidden'
              }}>
                <button 
                  className="dropdown-item" 
                  style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: 14, color: '#0f172a' }}
                  onClick={() => { setShowExportMenu(false); generatePDF(); }}
                >
                  <FileText size={18} style={{ color: '#ef4444' }} /> PDF Report
                </button>
                <button 
                  className="dropdown-item" 
                  style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#0f172a' }}
                  onClick={() => { setShowExportMenu(false); generateExcel(); }}
                >
                  <Download size={18} style={{ color: '#10b981' }} /> Excel Sheet
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={16} /> New Costing
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Calculator size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Sheets</h3>
            <div className="value">{sheets.length}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Approved</h3>
            <div className="value">{sheets.filter(s => s.status === 'Approved').length}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Pending Approval</h3>
            <div className="value">{sheets.filter(s => s.status === 'Pending Approval').length}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-details">
            <h3>Average Margin</h3>
            <div className="value">
                {sheets.length > 0 ? (sheets.reduce((acc, s) => acc + (s.profit_margin_pct||0), 0) / sheets.length).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Costing No, Buyer..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }}>
            <option>All Types</option>
            <option>Approved</option>
            <option>Pending</option>
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

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Costing No</th>
                  <th>Buyer</th>
                  <th>Product / Const</th>
                  <th>Date</th>
                  <th>Est. Cost</th>
                  <th>Margin %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheets.filter(s => 
                  (s.costing_no || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (s.buyer || '').toLowerCase().includes(searchTerm.toLowerCase())
                ).map(s => (
                  <tr key={s.id} onClick={() => handleEdit(s)} style={{ cursor: 'pointer', transition: 'background 0.2s' }}>
                    <td style={{ fontWeight: 600 }}>{s.costing_no}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.buyer}</td>
                    <td>
                        <span className="badge badge-active" style={{ marginBottom: 4 }}>{s.construction}</span>
                    </td>
                    <td>{s.costing_date}</td>
                    <td style={{ fontWeight: 600 }}><IndianRupee size={12}/>{s.estimated_cost?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: s.profit_margin_pct >= 10 ? '#047857' : s.profit_margin_pct > 0 ? '#c2410c' : '#b91c1c' }}>
                      {s.profit_margin_pct?.toFixed(1)}%
                    </td>
                    <td>
                      <span className="badge badge-active" style={{
                        background: s.status === 'Approved' ? '#dcfce7' : s.status === 'Draft' ? '#f1f5f9' : '#fef9c3',
                        color: s.status === 'Approved' ? '#166534' : s.status === 'Draft' ? '#475569' : '#854d0e'
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => setSelectedViewSheet(s)}
                          title="Preview Costing"
                        >
                          <Eye size={16} color="var(--primary)" />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleEdit(s)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ show: true, id: s.id, name: s.costing_no }); }}
                          title="Delete"
                        >
                          <Trash2 size={16} color="var(--danger, #ef4444)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '0 8px' }}>
            <span style={{ color: '#64748b', fontSize: 14 }}>Showing {sheets.length} records</span>
            <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Previous</button>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}>1</button>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Next</button>
            </div>
        </div>

      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420, padding: 24, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16, textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: '#fef2f2',
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
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
                    await costingSheetAPI.delete(id);
                    fetchData();
                  } catch (err) {
                    alert("Error deleting Costing Sheet.");
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Costing Sheet Preview Modal */}
      {selectedViewSheet && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} /> 
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Costing Sheet Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => setSelectedViewSheet(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            {/* Scrollable Modal Body (Greyish background) */}
            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              
              {/* A4 Paper */}
              <div style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>
                
                {/* Top Header Section */}
                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Handloom ERP" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                         <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                         <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>COSTING SHEET PROFILE</h2>
                      
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Costing No</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedViewSheet.costing_no}</div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewSheet.status || 'DRAFT').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Costing Date</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{selectedViewSheet.costing_date}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thick Line */}
                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                {/* Body Content */}
                <div style={{ padding: '10px 40px 40px 40px' }}>
                  {/* Section 1 */}
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. GENERAL DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        <InfoRow2 label="Buyer" value={selectedViewSheet.buyer || '-'} />
                        <InfoRow2 label="Buyer Order" value={selectedViewSheet.buyer_order || '-'} />
                      </div>
                      <div>
                        <InfoRow2 label="Construction" value={selectedViewSheet.construction || '-'} />
                        <InfoRow2 label="PO Quantity" value={selectedViewSheet.po_quantity || '0'} />
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <Calculator size={14} /> 2. COSTING SUMMARY
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        <InfoRow2 label="Estimated Cost" value={`₹ ${selectedViewSheet.estimated_cost?.toFixed(2) || '0.00'}`} />
                        <InfoRow2 label="Selling Price" value={`₹ ${selectedViewSheet.selling_price?.toFixed(2) || '0.00'}`} />
                      </div>
                      <div>
                        <InfoRow2 label="Profit Margin" value={`${selectedViewSheet.profit_margin_pct?.toFixed(2) || '0.00'} %`} />
                        <InfoRow2 label="Profit Value" value={`₹ ${selectedViewSheet.profit_value?.toFixed(2) || '0.00'}`} />
                      </div>
                    </div>
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
