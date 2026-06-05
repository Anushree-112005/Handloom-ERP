import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles, Upload, Cpu, Download, Plus, Trash2, ArrowRight, CheckCircle,
  AlertCircle, RefreshCw, Layers, Settings, ChevronDown, Eye
} from 'lucide-react';
import { textileDesignAPI } from '../../services/api';
import './DesignAI.css';

/* ── Yarn count mapping (same as Streamlit) ────────────────── */
const YARN_COUNTS = {
  "10S CTN": 10.0,
  "20S CTN": 20.0,
  "2/40S CTN": 20.0,
  "30S CTN": 30.0,
  "2/60S CTN": 30.0,
  "40S CTN": 40.0,
  "2/80S CTN": 40.0,
  "60S CTN": 60.0,
  "80S CTN": 80.0,
};

const KG_PER_LB = 0.45359237;
const YARDS_PER_HANK = 840;

/* ── Yarn weight formulas (ported from yarn_calculator.py) ─── */
function warpWeightKg(totalEnds, lengthYards, eqCount, wastage) {
  const weightLbs = (totalEnds * lengthYards) / (eqCount * YARDS_PER_HANK);
  return weightLbs * wastage * KG_PER_LB;
}
function weftWeightKg(ppi, widthInches, lengthYards, eqCount, wastage) {
  const totalPicks = ppi * widthInches * lengthYards;
  const weightLbs = totalPicks / (eqCount * YARDS_PER_HANK);
  return weightLbs * wastage * KG_PER_LB;
}

/* ── Helper: compress adjacent same-color entries ─── */
function compressSequence(seq) {
  const compressed = [];
  for (const item of seq) {
    if (compressed.length > 0 && compressed[compressed.length - 1].color_name === item.color_name) {
      compressed[compressed.length - 1] = {
        ...compressed[compressed.length - 1],
        threads: compressed[compressed.length - 1].threads + item.threads,
      };
    } else {
      compressed.push({ ...item });
    }
  }
  return compressed;
}

export default function DesignAI() {
  const fileInputRef = useRef(null);

  /* ── Sidebar parameter state (matches Streamlit sidebar) ──── */
  const [companyName, setCompanyName] = useState('Dinesh Exports Private Limited');
  const [designName, setDesignName] = useState('MTM000-XXXX');
  const [targetWidth, setTargetWidth] = useState(59.40);
  const [targetLength, setTargetLength] = useState(1000.0);
  const [reed, setReed] = useState(64);
  const [pick, setPick] = useState(52);
  const [warpCountLabel, setWarpCountLabel] = useState('20S CTN');
  const [weftCountLabel, setWeftCountLabel] = useState('20S CTN');
  const [wastage, setWastage] = useState(1.08);
  const [numColorsLabel, setNumColorsLabel] = useState('Auto-Detect');
  const [weftDesignType, setWeftDesignType] = useState('Solid (100% Background Color)');

  /* ── AI analysis result state ─── */
  const [analyzing, setAnalyzing] = useState(false);
  const [weaveType, setWeaveType] = useState(null);
  const [orientation, setOrientation] = useState(null);
  const [dominantColors, setDominantColors] = useState(null);
  const [repeatingSequence, setRepeatingSequence] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  /* ── Derived values ─── */
  const warpEqCount = YARN_COUNTS[warpCountLabel] || 20.0;
  const weftEqCount = YARN_COUNTS[weftCountLabel] || 20.0;
  const totalWarpEnds = Math.round(reed * targetWidth);

  /* ── Image upload handler ─── */
  const triggerFileInput = () => fileInputRef.current?.click();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreviewUrl(ev.target.result);
    reader.readAsDataURL(file);

    // Store file for analysis
    fileInputRef.current._selectedFile = file;
    setSuccessMsg('Image loaded. Click "Run Analysis" to analyze.');
    setError(null);
  };

  /* ── Run Analysis handler ─── */
  const handleRunAnalysis = async () => {
    const file = fileInputRef.current?._selectedFile;
    if (!file) {
      setError('Please upload a fabric image first.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setSuccessMsg(null);

      const numColors = numColorsLabel === 'Auto-Detect' ? 'auto' : numColorsLabel;
      const res = await textileDesignAPI.analyzeImageOnly(file, numColors);
      const data = res.data;

      setWeaveType(data.weave_type || 'Plain');
      setOrientation(data.orientation || '—');
      setDominantColors(data.dominant_colors || []);
      setRepeatingSequence(data.repeating_sequence || []);
      setSuccessMsg('✅ Analysis complete!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Analysis failed. Check backend.');
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Live summary computation (same as Streamlit app.py lines 274-459) ─── */
  const summaryData = useMemo(() => {
    if (!dominantColors || dominantColors.length === 0) return null;

    const repSeq = repeatingSequence || [];

    // Warp design from vision
    const rawWarp = repSeq.length > 0
      ? repSeq
      : dominantColors.map(c => ({ color_name: c.color_name, threads: 1, hex: c.hex }));
    const warpDesign = compressSequence(rawWarp);

    // Weft design
    let weftDesign;
    if (weftDesignType === 'Solid (100% Background Color)') {
      const dom = dominantColors[0];
      weftDesign = [{ color_name: dom.color_name, threads: 1, hex: dom.hex }];
    } else {
      weftDesign = compressSequence(warpDesign);
    }

    // Warp by color lookup
    const warpByColor = {};
    for (const item of warpDesign) {
      warpByColor[item.color_name] = (warpByColor[item.color_name] || 0) + item.threads;
    }
    const warpRepeatSum = Object.values(warpByColor).reduce((a, b) => a + b, 0);

    // Build summary entries
    const summaryEntries = [];

    // Warp entries
    for (const c of dominantColors) {
      const cname = c.color_name;
      const hexC = c.hex;
      const ratio = c.percentage / 100.0;
      const totalEndsColor = Math.round(totalWarpEnds * ratio);

      let endsInRep = warpByColor[cname] || 0;
      if (endsInRep === 0) {
        endsInRep = Math.round(warpRepeatSum * ratio);
        if (endsInRep === 0 && warpRepeatSum > 0) endsInRep = 1;
      }

      const warpKg = warpWeightKg(totalEndsColor, targetLength, warpEqCount, wastage);

      summaryEntries.push({
        beam_type: 'Warp Beam1',
        count: warpCountLabel,
        color: cname,
        hex: hexC,
        ends: endsInRep,
        total_ends: totalEndsColor,
        req_kg: Math.round(warpKg * 100) / 100,
      });
    }

    // Weft entries
    if (weftDesignType === 'Solid (100% Background Color)') {
      const dom = dominantColors[0];
      const wKg = weftWeightKg(pick, targetWidth, targetLength, weftEqCount, wastage);
      summaryEntries.push({
        beam_type: 'Weft',
        count: weftCountLabel,
        color: dom.color_name,
        hex: dom.hex,
        ends: 1,
        total_ends: Math.round(pick * targetWidth),
        req_kg: Math.round(wKg * 100) / 100,
      });
    } else {
      const weftByColor = {};
      for (const item of weftDesign) {
        weftByColor[item.color_name] = (weftByColor[item.color_name] || 0) + item.threads;
      }
      const weftRepeatSum = Object.values(weftByColor).reduce((a, b) => a + b, 0);

      for (const c of dominantColors) {
        const cname = c.color_name;
        const hexC = c.hex;
        const ratio = c.percentage / 100.0;
        const weftTotalEndsColor = Math.round(pick * targetWidth * ratio);

        let endsInRep = weftByColor[cname] || 0;
        if (endsInRep === 0) {
          endsInRep = Math.round(weftRepeatSum * ratio);
          if (endsInRep === 0 && weftRepeatSum > 0) endsInRep = 1;
        }

        const wKg = weftWeightKg(pick * ratio, targetWidth, targetLength, weftEqCount, wastage);
        summaryEntries.push({
          beam_type: 'Weft',
          count: weftCountLabel,
          color: cname,
          hex: hexC,
          ends: endsInRep,
          total_ends: weftTotalEndsColor,
          req_kg: Math.round(wKg * 100) / 100,
        });
      }
    }

    // Aggregate duplicate colors
    const agg = {};
    const aggKeys = [];
    for (const row of summaryEntries) {
      const k = `${row.beam_type}|${row.color}`;
      if (agg[k]) {
        agg[k].ends += row.ends;
        agg[k].total_ends += row.total_ends;
        agg[k].req_kg = Math.round((agg[k].req_kg + row.req_kg) * 100) / 100;
      } else {
        agg[k] = { ...row };
        aggKeys.push(k);
      }
    }
    const summaryAgg = aggKeys.map(k => agg[k]);

    const totalRepeatEnds = summaryAgg.reduce((s, r) => s + r.ends, 0);
    const totalEnds = summaryAgg.reduce((s, r) => s + r.total_ends, 0);
    const totalKg = Math.round(summaryAgg.reduce((s, r) => s + r.req_kg, 0) * 100) / 100;

    return { summaryAgg, totalRepeatEnds, totalEnds, totalKg, warpDesign, weftDesign };
  }, [dominantColors, repeatingSequence, reed, targetWidth, targetLength, pick, wastage,
    warpCountLabel, weftCountLabel, warpEqCount, weftEqCount, totalWarpEnds, weftDesignType]);

  /* ── Render ─── */
  return (
    <div className="dai-root">
      {/* ── SIDEBAR PANEL ─── */}
      <div className="dai-sidebar">
        <div className="dai-sidebar-header">
          <Settings size={18} /> Loom & Yarn Parameters
        </div>
        <div className="dai-sidebar-body">
          <label className="dai-label">Company Name</label>
          <input className="dai-input" value={companyName} onChange={e => setCompanyName(e.target.value)} />

          <label className="dai-label">Design Name / D.No</label>
          <input className="dai-input" value={designName} onChange={e => setDesignName(e.target.value)} />

          <label className="dai-label">Target Fabric Width (inches)</label>
          <div className="dai-number-wrap">
            <button className="dai-num-btn" onClick={() => setTargetWidth(v => Math.round((v - 0.1) * 100) / 100)}>−</button>
            <input className="dai-input dai-num-input" type="number" step="0.1" value={targetWidth}
              onChange={e => setTargetWidth(parseFloat(e.target.value) || 0)} />
            <button className="dai-num-btn" onClick={() => setTargetWidth(v => Math.round((v + 0.1) * 100) / 100)}>+</button>
          </div>

          <label className="dai-label">Target Order Length (yards)</label>
          <div className="dai-number-wrap">
            <button className="dai-num-btn" onClick={() => setTargetLength(v => Math.max(0, v - 100))}>−</button>
            <input className="dai-input dai-num-input" type="number" step="100" value={targetLength}
              onChange={e => setTargetLength(parseFloat(e.target.value) || 0)} />
            <button className="dai-num-btn" onClick={() => setTargetLength(v => v + 100)}>+</button>
          </div>

          <label className="dai-label">Loom Reed</label>
          <div className="dai-number-wrap">
            <button className="dai-num-btn" onClick={() => setReed(v => Math.max(1, v - 1))}>−</button>
            <input className="dai-input dai-num-input" type="number" step="1" value={reed}
              onChange={e => setReed(parseInt(e.target.value) || 0)} />
            <button className="dai-num-btn" onClick={() => setReed(v => v + 1)}>+</button>
          </div>

          <label className="dai-label">Pick (PPI)</label>
          <div className="dai-number-wrap">
            <button className="dai-num-btn" onClick={() => setPick(v => Math.max(1, v - 1))}>−</button>
            <input className="dai-input dai-num-input" type="number" step="1" value={pick}
              onChange={e => setPick(parseInt(e.target.value) || 0)} />
            <button className="dai-num-btn" onClick={() => setPick(v => v + 1)}>+</button>
          </div>

          <div className="dai-divider" />
          <div className="dai-sidebar-header" style={{ padding: 0, marginBottom: 12, fontSize: 13 }}>
            <Layers size={14} /> Yarn Selection
          </div>

          <label className="dai-label">Warp Yarn Count</label>
          <select className="dai-input" value={warpCountLabel} onChange={e => setWarpCountLabel(e.target.value)}>
            {Object.keys(YARN_COUNTS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>

          <label className="dai-label">Weft Yarn Count</label>
          <select className="dai-input" value={weftCountLabel} onChange={e => setWeftCountLabel(e.target.value)}>
            {Object.keys(YARN_COUNTS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>

          <div className="dai-divider" />
          <div className="dai-sidebar-header" style={{ padding: 0, marginBottom: 12, fontSize: 13 }}>
            <Settings size={14} /> Advanced Specs
          </div>

          <label className="dai-label">Wastage Factor: <strong style={{ color: '#f7b267' }}>{wastage.toFixed(2)}</strong></label>
          <input type="range" className="dai-slider" min="1" max="1.2" step="0.01" value={wastage}
            onChange={e => setWastage(parseFloat(e.target.value))} />

          <label className="dai-label">Expected Color Count (K)</label>
          <select className="dai-input" value={numColorsLabel} onChange={e => setNumColorsLabel(e.target.value)}>
            <option value="Auto-Detect">Auto-Detect</option>
            {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <div className="dai-divider" />
          <div className="dai-sidebar-header" style={{ padding: 0, marginBottom: 12, fontSize: 13 }}>
            <Layers size={14} /> Weft Design Configuration
          </div>

          <label className="dai-label">Weft Design Style</label>
          <div className="dai-radio-group">
            <label className="dai-radio">
              <input type="radio" name="weft_type" value="Striped (Matches Warp)"
                checked={weftDesignType === 'Striped (Matches Warp)'}
                onChange={e => setWeftDesignType(e.target.value)} />
              <span>Striped (Matches Warp)</span>
            </label>
            <label className="dai-radio">
              <input type="radio" name="weft_type" value="Solid (100% Background Color)"
                checked={weftDesignType === 'Solid (100% Background Color)'}
                onChange={e => setWeftDesignType(e.target.value)} />
              <span>Solid (100% Background Color)</span>
            </label>
          </div>

          <div className="dai-divider" />
          <div className="dai-metric-card">
            <div className="dai-metric-label">Calculated Total Warp Ends</div>
            <div className="dai-metric-value">{totalWarpEnds}</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─── */}
      <div className="dai-main">
        {/* Title */}
        <h1 className="dai-title">
          <Sparkles size={28} className="dai-title-icon" /> Fabric Design Sheet Generator
        </h1>
        <p className="dai-subtitle">
          Upload a cloth image to extract its structural properties and calculate required yarn weights.
        </p>

        {/* Notifications */}
        {error && (
          <div className="dai-alert dai-alert-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {successMsg && (
          <div className="dai-alert dai-alert-success">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        {/* ── Image Upload + Analysis Results split ─── */}
        <div className="dai-analysis-grid">
          {/* Left: Upload */}
          <div className="dai-panel">
            <h3 className="dai-panel-title">Upload Cloth Image (JPEG/PNG)</h3>
            <div className="dai-upload-zone" onClick={triggerFileInput}>
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Uploaded" className="dai-preview-img" />
              ) : (
                <div className="dai-upload-placeholder">
                  <Upload size={40} />
                  <p>Click to browse or drag & drop</p>
                  <span>PNG, JPG, JPEG up to 10MB</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload}
              style={{ display: 'none' }} accept="image/*" />

            {imagePreviewUrl && (
              <p style={{ textAlign: 'center', color: 'var(--dai-muted)', fontSize: 12, marginTop: 8 }}>Uploaded Image</p>
            )}

            <button
              className={`dai-btn dai-btn-primary dai-btn-analyze ${analyzing ? 'analyzing' : ''}`}
              onClick={handleRunAnalysis}
              disabled={analyzing || !imagePreviewUrl}
              style={{ marginTop: 16 }}
            >
              {analyzing ? (
                <><Cpu size={16} className="dai-spin" /> Analysing...</>
              ) : (
                <><Cpu size={16} /> Run Analysis</>
              )}
            </button>
          </div>

          {/* Right: Analysis Results */}
          <div className="dai-panel">
            {dominantColors ? (
              <>
                <h3 className="dai-panel-title">Image Analysis</h3>

                {/* Weave + Orientation cards */}
                <div className="dai-metric-row">
                  <div className="dai-result-card">
                    <div className="dai-result-label">Detected Weave</div>
                    <div className="dai-result-value" style={{ color: '#f7b267' }}>{weaveType || '—'}</div>
                  </div>
                  <div className="dai-result-card">
                    <div className="dai-result-label">Detected Stripe Direction</div>
                    <div className="dai-result-value" style={{ color: '#f7b267' }}>{orientation || '—'}</div>
                  </div>
                </div>

                {/* Color swatches */}
                <p className="dai-label" style={{ marginTop: 20, marginBottom: 12 }}><strong>Extracted Colors:</strong></p>
                <div className="dai-color-swatches">
                  {dominantColors.map((c, i) => (
                    <div key={i} className="dai-swatch">
                      <div className="dai-swatch-box" style={{ background: c.hex }} />
                      <div className="dai-swatch-name">{c.color_name}</div>
                      <div className="dai-swatch-pct">({c.percentage.toFixed(1)}%)</div>
                    </div>
                  ))}
                </div>

                {/* Repeating sequence */}
                <p className="dai-label" style={{ marginTop: 20, marginBottom: 8 }}><strong>Detected Repeating Color Sequence:</strong></p>
                {repeatingSequence && repeatingSequence.length > 0 ? (
                  <div className="dai-sequence-bar">
                    {repeatingSequence.map((item, idx) => (
                      <span key={idx} className="dai-seq-chip" style={{ background: item.hex || '#888', color: '#fff' }}>
                        {item.color_name} ({item.threads} th)
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="dai-alert dai-alert-warning" style={{ margin: 0 }}>
                    No stripes detected (uniform fabric).
                  </div>
                )}
              </>
            ) : (
              <div className="dai-empty-state">
                <Eye size={40} />
                <p>Analysis results will appear here after you upload an image and run analysis.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Summary Table ─── */}
        {summaryData && (
          <>
            <div className="dai-divider" style={{ margin: '32px 0' }} />
            <h2 className="dai-section-title">Design Requirement - Summary Table</h2>

            <div className="dai-table-wrap">
              <table className="dai-summary-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Beam Type</th>
                    <th>Count</th>
                    <th>Color</th>
                    <th>Color Hex</th>
                    <th>Ends (Repeat)</th>
                    <th>Total End</th>
                    <th>Req Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.summaryAgg.map((row, i) => (
                    <tr key={i}>
                      <td>{i}</td>
                      <td><span className={`dai-beam-badge ${row.beam_type.includes('Warp') ? 'warp' : 'weft'}`}>{row.beam_type}</span></td>
                      <td>{row.count}</td>
                      <td style={{ color: row.hex, fontWeight: 700 }}>{row.color}</td>
                      <td><span className="dai-hex-chip" style={{ background: row.hex }}>{row.hex}</span></td>
                      <td>{row.ends}</td>
                      <td style={{ fontWeight: 700 }}>{row.total_ends}</td>
                      <td style={{ fontWeight: 700, color: '#f7b267' }}>{row.req_kg}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 800, textAlign: 'right' }}>TOTAL</td>
                    <td style={{ fontWeight: 700 }}>{summaryData.totalRepeatEnds}</td>
                    <td style={{ fontWeight: 700 }}>{summaryData.totalEnds}</td>
                    <td style={{ fontWeight: 800, color: '#f7b267', fontSize: 15 }}>{summaryData.totalKg}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
