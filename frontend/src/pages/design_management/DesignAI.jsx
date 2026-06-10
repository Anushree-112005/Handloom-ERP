import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles, Upload, Cpu, Download, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle,
  AlertCircle, RefreshCw, Layers, Settings, ChevronDown, Eye, Database
} from 'lucide-react';
import { textileDesignAPI, subMasterAPI } from '../../services/api';
import './DesignAI.css';

const YARN_COUNTS = {
  "10S CTN": 10.0,
  "20S CTN": 20.0,
  "30S CTN": 30.0,
  "40S CTN": 40.0,
  "60S CTN": 60.0,
  "80S CTN": 80.0,
  "2/20S CTN": 10.0,
  "2/40S CTN": 20.0,
  "2/60S CTN": 30.0,
  "2/80S CTN": 40.0,
};

const KG_PER_LB = 0.45359237;
const YARDS_PER_HANK = 840;
const METERS_TO_YARDS = 1.09361;

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
  const [targetLength, setTargetLength] = useState(4900); // Target Order Length (PO.mtr), default to 4900
  const [productionLength, setProductionLength] = useState(5500); // Production Length (Pro.mtr), default to 5500
  const [sizedLength, setSizedLength] = useState(5850); // Warp/Sized Length (Sized.mtr), default to 5850
  const [lengthUnit, setLengthUnit] = useState('meters'); // 'meters' or 'yards'
  const [reed, setReed] = useState(100);
  const [pick, setPick] = useState(52);
  const [warpCountLabel, setWarpCountLabel] = useState('40S CTN');
  const [weftCountLabel, setWeftCountLabel] = useState('20S CTN');
  const [wastage, setWastage] = useState(1.08);
  const [selvage, setSelvage] = useState(3); // inches added to weft width
  const [numColorsLabel, setNumColorsLabel] = useState('Auto-Detect');
  const [weftDesignType, setWeftDesignType] = useState('Striped (Matches Warp)');

  // Synchronize Production & Sized lengths when Target Order Length is edited
  const updateLengths = (val) => {
    setTargetLength(val);
    setProductionLength(Math.round(val * 1.12245));
    setSizedLength(Math.round(val * 1.19388));
  };

  /* ── AI analysis result state ─── */
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [weaveType, setWeaveType] = useState(null);
  const [orientation, setOrientation] = useState(null);
  const [dominantColors, setDominantColors] = useState(null);
  const [repeatingSequence, setRepeatingSequence] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  /* ── Save / Load Persistence State ─── */
  const [savedId, setSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imagePath, setImagePath] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);

  /* ── Crop State removed ─── */

  /* ── Derived values ─── */
  const warpEqCount = YARN_COUNTS[warpCountLabel] || 20.0;
  const weftEqCount = YARN_COUNTS[weftCountLabel] || 20.0;
  const totalWarpEnds = Math.round(reed * targetWidth);
  // Weft width includes selvage allowance (standard 3" each side)
  const weftWidth = targetWidth + selvage;
  // Convert length to yards for all internal calculations
  const lengthYards = lengthUnit === 'meters'
    ? sizedLength * METERS_TO_YARDS
    : sizedLength;

  /* ── Image upload handler ─── */
  const triggerFileInput = () => fileInputRef.current?.click();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Store file for analysis
    fileInputRef.current._selectedFile = file;

    // Clear previous results immediately
    setWeaveType(null);
    setOrientation(null);
    setDominantColors(null);
    setRepeatingSequence(null);
    setError(null);
    setSuccessMsg(null);

    // Show preview immediately — no crop step
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreviewUrl(ev.target.result);
      setSuccessMsg('Image loaded. Click "Run Analysis" to analyze.');
    };
    reader.readAsDataURL(file);
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
      setWeaveType(null);
      setOrientation(null);
      setDominantColors(null);
      setRepeatingSequence(null);

      const numColors = numColorsLabel === 'Auto-Detect' ? 'auto' : numColorsLabel;
      const res = await textileDesignAPI.analyzeImageOnly(file, numColors);
      const data = res.data;

      setWeaveType(data.weave_type || 'Plain');
      setOrientation(data.orientation || '—');
      setDominantColors(data.dominant_colors || []);
      setRepeatingSequence(data.repeating_sequence || []);
      if (data.orientation === 'warp (vertical stripes)') {
        setWeftDesignType('Solid (100% Background Color)');
      } else if (data.repeating_sequence && data.repeating_sequence.length > 0) {
        setWeftDesignType('Striped (Matches Warp)');
      } else {
        setWeftDesignType('Solid (100% Background Color)');
      }
      setSuccessMsg('✅ Analysis complete!');
      // Auto-sync detected colors to Color Master (silent — does not block UI)
      try {
        const colorsToSync = (data.dominant_colors || []).map(c => ({
          color_name: c.color_name,
          hex: c.hex,
        }));
        if (colorsToSync.length > 0) {
          await subMasterAPI.syncColors(colorsToSync);
        }
      } catch (syncErr) {
        console.warn('Color Master sync failed (non-critical):', syncErr);
      }
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
    const rawWarp = repSeq.length > 0
      ? repSeq
      : dominantColors.map(c => ({ color_name: c.color_name, threads: 1, hex: c.hex }));
    const warpDesign = compressSequence(rawWarp);
    let warpRepeatSize = 0;
    let i_rep = 0;
    while (i_rep < warpDesign.length) {
      const item = warpDesign[i_rep];
      if (item.top) {
        const block = [];
        const topVal = item.top;
        while (i_rep < warpDesign.length && warpDesign[i_rep].top === topVal) {
          block.push(warpDesign[i_rep]);
          i_rep++;
        }
        if (block.length > 1 && block[0].color_name === block[block.length - 1].color_name && block[0].threads === block[block.length - 1].threads) {
          const boundaryThreads = block[0].threads;
          const middleThreads = block.slice(1, -1).reduce((sum, it) => sum + it.threads, 0);
          warpRepeatSize += boundaryThreads * (topVal + 1) + middleThreads * topVal;
        } else {
          warpRepeatSize += block.reduce((sum, it) => sum + it.threads * topVal, 0);
        }
      } else {
        warpRepeatSize += item.threads;
        i_rep++;
      }
    }

    const noD = warpRepeatSize > 0 ? Math.floor(totalWarpEnds / warpRepeatSize) : 0;
    const repeatEnds = warpRepeatSize * noD;
    const selvage = 0;
    const balance = totalWarpEnds - repeatEnds - selvage;

    // Distribute balance to extra ends
    const extraEnds = warpDesign.map(() => 0);
    let remaining = balance;
    let idx = 0;
    while (remaining > 0 && warpDesign.length > 0) {
      const item = warpDesign[idx % warpDesign.length];
      const take = Math.min(remaining, item.threads);
      extraEnds[idx % warpDesign.length] += take;
      remaining -= take;
      idx++;
    }

    // Aggregate Warp design items by color
    const warpColorAgg = {};
    warpDesign.forEach((item, index) => {
      const cname = item.color_name;
      const hex = item.hex;
      const itemEnds = item.threads;
      const itemExtra = extraEnds[index];
      const itemTotalEnds = (itemEnds * noD) + itemExtra;
      
      if (warpColorAgg[cname]) {
        warpColorAgg[cname].ends += itemEnds;
        warpColorAgg[cname].extra += itemExtra;
        warpColorAgg[cname].total_ends += itemTotalEnds;
      } else {
        warpColorAgg[cname] = {
          beam_type: 'Warp Beam1',
          count: warpCountLabel,
          color: cname,
          hex: hex,
          ends: itemEnds,
          noD: noD,
          extra: itemExtra,
          total_ends: itemTotalEnds,
        };
      }
    });

    const warpSummary = Object.values(warpColorAgg).map(row => {
      const warp_length = sizedLength + 30;
      const warp_wastage = wastage - 0.015;
      const req_kg = Math.ceil((row.total_ends * warp_length) / (warpEqCount * 1693.6) * warp_wastage);
      return {
        ...row,
        req_kg: req_kg
      };
    });

    // Weft Design
    let weftDesign = [];
    let weftSummary = [];
    const totalWeftEnds = Math.round(pick * weftWidth); // weftWidth includes selvage

    if (weftDesignType === 'Solid (100% Background Color)') {
      const dom = dominantColors[0] || { color_name: 'White', hex: '#ffffff' };
      weftDesign = [{ color_name: dom.color_name, threads: totalWeftEnds, hex: dom.hex }];
      
      const weft_wastage = wastage - 0.085;
      const req_kg = Math.ceil((totalWeftEnds * sizedLength) / (weftEqCount * 1693.6) * weft_wastage);
      weftSummary = [{
        beam_type: 'Weft',
        count: weftCountLabel,
        color: dom.color_name,
        hex: dom.hex,
        ends: totalWeftEnds,
        noD: 1,
        extra: 0,
        total_ends: totalWeftEnds,
        req_kg: req_kg
      }];
    } else {
      // Repeating Weft Design
      const rawWeft = compressSequence(warpDesign);
      weftDesign = rawWeft;
      const weftRepeatSize = weftDesign.reduce((s, r) => s + r.threads, 0);
      const weftNoD = weftRepeatSize > 0 ? Math.floor(totalWeftEnds / weftRepeatSize) : 0;
      const weftRepeatEnds = weftRepeatSize * weftNoD;
      const weftBalance = totalWeftEnds - weftRepeatEnds;

      const weftExtraEnds = weftDesign.map(() => 0);
      let weftRemaining = weftBalance;
      let wIdx = 0;
      while (weftRemaining > 0 && weftDesign.length > 0) {
        const item = weftDesign[wIdx % weftDesign.length];
        const take = Math.min(weftRemaining, item.threads);
        weftExtraEnds[wIdx % weftDesign.length] += take;
        weftRemaining -= take;
        wIdx++;
      }

      const weftColorAgg = {};
      weftDesign.forEach((item, index) => {
        const cname = item.color_name;
        const hex = item.hex;
        const itemEnds = item.threads;
        const itemExtra = weftExtraEnds[index];
        const itemTotalEnds = (itemEnds * weftNoD) + itemExtra;
        
        if (weftColorAgg[cname]) {
          weftColorAgg[cname].ends += itemEnds;
          weftColorAgg[cname].extra += itemExtra;
          weftColorAgg[cname].total_ends += itemTotalEnds;
        } else {
          weftColorAgg[cname] = {
            beam_type: 'Weft',
            count: weftCountLabel,
            color: cname,
            hex: hex,
            ends: itemEnds,
            noD: weftNoD,
            extra: itemExtra,
            total_ends: itemTotalEnds,
          };
        }
      });

      weftSummary = Object.values(weftColorAgg).map(row => {
        const weft_wastage = wastage - 0.085;
        const req_kg = Math.ceil((row.total_ends * sizedLength) / (weftEqCount * 1693.6) * weft_wastage);
        return {
          ...row,
          req_kg: req_kg
        };
      });
    }

    // Totals
    const warpTotalEnds = warpSummary.reduce((s, r) => s + r.total_ends, 0);
    const warpTotalKg = Math.round(warpSummary.reduce((s, r) => s + r.req_kg, 0) * 100) / 100;
    
    const weftTotalEnds = weftSummary.reduce((s, r) => s + r.total_ends, 0);
    const weftTotalKg = Math.round(weftSummary.reduce((s, r) => s + r.req_kg, 0) * 100) / 100;

    const grandTotalKg = Math.round((warpTotalKg + weftTotalKg) * 100) / 100;

    // Add rowSpan and showTop to warpDesign items for rendering
    const processedWarpDesign = [];
    let i_wd = 0;
    while (i_wd < warpDesign.length) {
      const item = warpDesign[i_wd];
      if (item.top) {
        const topVal = item.top;
        const block = [];
        while (i_wd < warpDesign.length && warpDesign[i_wd].top === topVal) {
          block.push(warpDesign[i_wd]);
          i_wd++;
        }
        block.forEach((blockItem, idx) => {
          processedWarpDesign.push({
            ...blockItem,
            rowSpan: idx === 0 ? block.length : 0,
            showTop: idx === 0 ? topVal : null
          });
        });
      } else {
        processedWarpDesign.push({
          ...item,
          rowSpan: 1,
          showTop: null
        });
        i_wd++;
      }
    }

    return {
      warpDesign: processedWarpDesign,
      weftDesign,
      warpRepeatSize,
      noD,
      repeatEnds,
      selvage,
      balance,
      warpSummary,
      weftSummary,
      warpTotalEnds,
      warpTotalKg,
      weftTotalEnds,
      weftTotalKg,
      grandTotalKg
    };
    }, [dominantColors, repeatingSequence, reed, targetWidth, selvage, weftWidth, targetLength, productionLength, sizedLength, lengthUnit, pick, wastage,
        warpCountLabel, weftCountLabel, warpEqCount, weftEqCount, totalWarpEnds, weftDesignType, lengthYards]);

  const warpColors = useMemo(() => {
    if (summaryData?.warpSummary) {
      const totalEnds = summaryData.warpTotalEnds || 1;
      return summaryData.warpSummary.map(row => ({
        color_name: row.color,
        hex: row.hex,
        percentage: (row.total_ends / totalEnds) * 100
      }));
    }
    return dominantColors || [];
  }, [summaryData, dominantColors]);

  const weftColors = useMemo(() => {
    if (summaryData?.weftSummary) {
      const totalEnds = summaryData.weftTotalEnds || 1;
      return summaryData.weftSummary.map(row => ({
        color_name: row.color,
        hex: row.hex,
        percentage: (row.total_ends / totalEnds) * 100
      }));
    }
    return dominantColors || [];
  }, [summaryData, dominantColors]);

  /* ── Download PDF handler ─── */
  const handleDownloadPdf = async () => {
    if (!summaryData) return;
    try {
      setGeneratingPdf(true);
      setError(null);
      setSuccessMsg(null);

      // Prepare payload to match templates/design_sheet.html expectations
      const payload = {
        company_name: companyName,
        design_no: designName,
        weave_type: weaveType || 'Plain',
        reed: parseInt(reed) || 0,
        pick: parseInt(pick) || 0,
        width: parseFloat(targetWidth) || 0.0,
        order_length: parseFloat(targetLength) || 0.0,
        warp_count: warpCountLabel,
        weft_count: weftCountLabel,
        wastage: parseFloat(wastage) || 1.08,
        total_ends: totalWarpEnds,
        
        warp_design: summaryData.warpDesign,
        weft_design: summaryData.weftDesign,
        warp_design_sum: summaryData.warpRepeatSize,
        weft_design_sum: summaryData.weftDesign.reduce((a, b) => a + b.threads, 0),
        
        noD: summaryData.noD,
        repeatEnds: summaryData.repeatEnds,
        balance: summaryData.balance,
        selvage: summaryData.selvage,
        
        warp_summary: summaryData.warpSummary,
        weft_summary: summaryData.weftSummary,
        warp_total_ends: summaryData.warpTotalEnds,
        warp_total_kg: summaryData.warpTotalKg,
        weft_total_ends: summaryData.weftTotalEnds,
        weft_total_kg: summaryData.weftTotalKg,
        grand_total_kg: summaryData.grandTotalKg
      };

      const response = await textileDesignAPI.generatePdf(payload);
      
      // Download file to browser
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${designName.replace(/\s+/g, '_')}_design_sheet.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg('✅ PDF Design Sheet generated and downloaded successfully!');
    } catch (err) {
      console.error(err);
      setError('PDF generation failed. Please check backend logs.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* ── Reset / Upload New Image handler ─── */
  const handleResetImage = () => {
    setImagePreviewUrl(null);
    setImagePath(null);
    setSavedId(null);
    setDesignName('MTM000-XXXX');
    
    // Clear AI results
    setWeaveType(null);
    setOrientation(null);
    setDominantColors(null);
    setRepeatingSequence(null);
    setSuccessMsg(null);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current._selectedFile = null;
    }
  };

  /* ── Save Design handler ─── */
  const handleSaveDesign = async () => {
    if (!summaryData) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      // Prepare warp/weft items
      const warpItems = summaryData.warpSummary.map((row, idx) => ({
        sno: idx + 1,
        yarn_count: row.count,
        color: row.color,
        threads: row.total_ends,
        ratio_pct: Math.round((row.total_ends / totalWarpEnds) * 10000) / 100,
        req_kg: row.req_kg
      }));

      const weftItems = summaryData.weftSummary.map((row, idx) => ({
        sno: idx + 1,
        yarn_count: row.count,
        color: row.color,
        threads: row.total_ends,
        ratio_pct: Math.round((row.total_ends / summaryData.weftTotalEnds) * 10000) / 100,
        req_kg: row.req_kg
      }));

      const payload = {
        design_name: designName,
        weave_type: weaveType || 'Plain',
        loom_width: parseFloat(targetWidth) || 0.0,
        finished_width: parseFloat(targetWidth) || 0.0,
        reed: parseFloat(reed) || 0.0,
        pick: parseFloat(pick) || 0.0,
        total_ends: parseFloat(totalWarpEnds) || 0.0,
        total_picks: parseFloat(pick * targetWidth) || 0.0,
        ppi: parseFloat(pick) || 0.0,
        epi: parseFloat(reed) || 0.0,
        fabric_length: parseFloat(targetLength) || 0.0,
        warp_wastage_pct: (wastage - 1) * 100,
        weft_wastage_pct: (wastage - 1) * 100,
        created_by: 'Admin',
        status: 'Draft',
        ai_detected_weave: weaveType,
        ai_confidence: 1.0,
        ai_color_clusters: dominantColors,
        ai_stripe_repeat: repeatingSequence,
        ai_analysis_status: 'completed',
        warp_kg: summaryData.warpTotalKg,
        weft_kg: summaryData.weftTotalKg,
        total_kg: summaryData.grandTotalKg,
        image_path: imagePath,
        warp_items: warpItems,
        weft_items: weftItems
      };

      let designRes;
      if (savedId) {
        // Update existing record
        designRes = await textileDesignAPI.update(savedId, payload);
        setSuccessMsg(`✅ Design ${designRes.data.design_no} updated successfully!`);
      } else {
        // Create new record
        designRes = await textileDesignAPI.create(payload);
        setSavedId(designRes.data.id);
        setDesignName(designRes.data.design_no);
        setSuccessMsg(`✅ Design ${designRes.data.design_no} created and saved successfully!`);
      }

      // If there is an un-uploaded file, upload it now
      const file = fileInputRef.current?._selectedFile;
      if (file && !imagePath) {
        const uploadRes = await textileDesignAPI.uploadImage(designRes.data.id, file);
        setImagePath(uploadRes.data.image_path);
        // Refresh preview with actual server image path
        setImagePreviewUrl(`http://localhost:8000${uploadRes.data.image_path}`);
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save design. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Load Design handler ─── */
  const handleLoadDesign = (design) => {
    setSavedId(design.id);
    setCompanyName(design.company_name || 'Dinesh Exports Private Limited');
    setDesignName(design.design_no || design.design_name || 'MTM000-XXXX');
    setTargetWidth(design.finished_width || design.loom_width || 59.40);
    const loadedLen = design.fabric_length || 4900.0;
    setTargetLength(loadedLen);
    setProductionLength(Math.round(loadedLen * 1.12245));
    setSizedLength(Math.round(loadedLen * 1.19388));
    setReed(Math.round(design.reed) || 100);
    setPick(Math.round(design.pick) || 52);
    setWastage(1 + (design.warp_wastage_pct || 8.0) / 100);
    setWeaveType(design.weave_type || 'Plain');
    
    // Set AI results
    setDominantColors(design.ai_color_clusters || []);
    setRepeatingSequence(design.ai_stripe_repeat || []);
    setOrientation(design.weave_type ? 'warp (vertical stripes)' : '—');
    if (design.weft_items && design.weft_items.length > 1) {
      setWeftDesignType('Striped (Matches Warp)');
    } else {
      setWeftDesignType('Solid (100% Background Color)');
    }
    setImagePreviewUrl(design.image_path ? `http://localhost:8000${design.image_path}` : null);
    setImagePath(design.image_path || null);
    
    if (design.weft_items && design.weft_items.length > 0) {
      setWeftCountLabel(design.weft_items[0].yarn_count || '20S CTN');
    }
    if (design.warp_items && design.warp_items.length > 0) {
      setWarpCountLabel(design.warp_items[0].yarn_count || '40S CTN');
    }
    
    setSuccessMsg(`Loaded design ${design.design_no} successfully.`);
    setShowDrawer(false);
  };

  /* ── Fetch Saved Designs list ─── */
  const fetchSavedDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const res = await textileDesignAPI.list();
      setSavedDesigns(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch saved designs.');
    } finally {
      setLoadingDesigns(false);
    }
  };

  /* ── Delete Saved Design ─── */
  const handleDeleteDesign = async (id, e) => {
    e.stopPropagation(); // prevent loading on click
    if (!window.confirm('Are you sure you want to delete this design?')) return;
    try {
      await textileDesignAPI.delete(id);
      setSavedDesigns(prev => prev.filter(d => d.id !== id));
      if (savedId === id) {
        setSavedId(null);
        setImagePath(null);
        setDesignName('MTM000-XXXX');
      }
      setSuccessMsg('Design deleted successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to delete design.');
    }
  };

  /* ── Open Saved Designs Drawer ─── */
  const handleOpenDrawer = () => {
    setShowDrawer(true);
    fetchSavedDesigns();
  };

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

          <label className="dai-label">Target Order Length (PO.mtr) ({lengthUnit === 'meters' ? 'Meters' : 'Yards'})</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button
              onClick={() => {
                if (lengthUnit === 'yards') {
                  setTargetLength(v => Math.round(v / METERS_TO_YARDS));
                  setProductionLength(v => Math.round(v / METERS_TO_YARDS));
                  setSizedLength(v => Math.round(v / METERS_TO_YARDS));
                  setLengthUnit('meters');
                }
              }}
              style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid #cbd5e1',
                background: lengthUnit === 'meters' ? '#4f46e5' : '#f1f5f9',
                color: lengthUnit === 'meters' ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 600
              }}
            >MTR</button>
            <button
              onClick={() => {
                if (lengthUnit === 'meters') {
                  setTargetLength(v => Math.round(v * METERS_TO_YARDS));
                  setProductionLength(v => Math.round(v * METERS_TO_YARDS));
                  setSizedLength(v => Math.round(v * METERS_TO_YARDS));
                  setLengthUnit('yards');
                }
              }}
              style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid #cbd5e1',
                background: lengthUnit === 'yards' ? '#4f46e5' : '#f1f5f9',
                color: lengthUnit === 'yards' ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 600
              }}
            >YDS</button>
          </div>
          <div className="dai-number-wrap" style={{ marginBottom: 12 }}>
            <button className="dai-num-btn" onClick={() => updateLengths(Math.max(0, targetLength - (lengthUnit === 'meters' ? 100 : 109)))}>−</button>
            <input className="dai-input dai-num-input" type="number" step={lengthUnit === 'meters' ? 100 : 109} value={targetLength}
              onChange={e => updateLengths(parseFloat(e.target.value) || 0)} />
            <button className="dai-num-btn" onClick={() => updateLengths(targetLength + (lengthUnit === 'meters' ? 100 : 109))}>+</button>
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

          <label className="dai-label">Selvage Width (inches) <strong style={{ color: '#f7b267' }}>{selvage}"</strong></label>
          <div className="dai-number-wrap">
            <button className="dai-num-btn" onClick={() => setSelvage(v => Math.max(0, v - 1))}>−</button>
            <input className="dai-input dai-num-input" type="number" step="1" value={selvage}
              onChange={e => setSelvage(parseFloat(e.target.value) || 0)} />
            <button className="dai-num-btn" onClick={() => setSelvage(v => v + 1)}>+</button>
          </div>

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

        {/* Persistence Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
          {imagePreviewUrl && (
            <button className="dai-btn" onClick={handleResetImage} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeft size={16} /> Upload New
            </button>
          )}
          <button className="dai-btn" onClick={handleOpenDrawer} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} /> View Saved Designs
          </button>
          {summaryData && (
            <button className="dai-btn dai-btn-primary" onClick={handleSaveDesign} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: saving ? '#94a3b8' : '#7c3aed' }}>
              {saving ? <RefreshCw size={16} className="dai-spin" /> : <CheckCircle size={16} />}
              {savedId ? 'Update Design' : 'Save Design'}
            </button>
          )}
        </div>

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

                {/* Warp and Weft Colors side by side */}
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: 20, marginBottom: 20 }}>
                  {/* Warp Column */}
                  <div style={{ flex: '1 1 200px' }}>
                    <p className="dai-label" style={{ marginBottom: 10 }}><strong>Warp Colors:</strong></p>
                    <div className="dai-color-swatches">
                      {warpColors.map((c, i) => (
                        <div key={i} className="dai-swatch">
                          <div className="dai-swatch-box" style={{ background: c.hex }} />
                          <div className="dai-swatch-name">{c.color_name}</div>
                          <div className="dai-swatch-pct">({c.percentage.toFixed(1)}%)</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weft Column */}
                  <div style={{ flex: '1 1 200px' }}>
                    <p className="dai-label" style={{ marginBottom: 10 }}><strong>Weft Colors:</strong></p>
                    <div className="dai-color-swatches">
                      {weftColors.map((c, i) => (
                        <div key={i} className="dai-swatch">
                          <div className="dai-swatch-box" style={{ background: c.hex }} />
                          <div className="dai-swatch-name">{c.color_name}</div>
                          <div className="dai-swatch-pct">({c.percentage.toFixed(1)}%)</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


              </>
            ) : (
              <div className="dai-empty-state">
                <Eye size={40} />
                <p>Analysis results will appear here after you upload an image and run analysis.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Three-Page Design Tables ─── */}
        {summaryData && (
          <>
            <div className="dai-divider" style={{ margin: '32px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="dai-section-title" style={{ margin: 0 }}>Fabric Design & Specifications</h2>
              <button
                className="dai-btn dai-btn-primary"
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
                style={{ background: '#4f46e5', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}
              >
                {generatingPdf ? (
                  <><RefreshCw size={16} className="dai-spin" /> Generating PDF...</>
                ) : (
                  <><Download size={16} /> Download PDF</>
                )}
              </button>
            </div>

            {/* Split layout for Warp and Weft tables side by side */}
            <div className="dai-design-tables-grid">
              {/* Warp Design Table */}
              <div className="dai-panel" style={{ padding: 20 }}>
                <h3 className="dai-panel-title">1. Warp Design</h3>
                <div className="dai-table-wrap">
                  <table className="dai-summary-table">
                    <thead>
                      <tr>
                        <th style={{ width: '10%' }}>S.No</th>
                        <th style={{ width: '30%' }}>Count</th>
                        <th style={{ width: '30%' }}>Color</th>
                        <th style={{ width: '15%' }} className="text-right">Base</th>
                        <th style={{ width: '15%' }} className="text-right">TOP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.warpDesign.map((item, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{warpCountLabel}</td>
                          <td style={{ color: item.hex, fontWeight: 700 }}>
                            <span className="color-swatch" style={{ background: item.hex, width: 10, height: 10, display: 'inline-block', marginRight: 6, border: '1px solid #ddd', borderRadius: 2 }} />
                            {item.color_name}
                          </td>
                          <td className="text-right" style={{ fontWeight: 600 }}>{item.threads}</td>
                          {item.rowSpan > 0 && (
                            <td 
                              rowSpan={item.rowSpan} 
                              className="text-center" 
                              style={{ 
                                verticalAlign: 'middle', 
                                borderLeft: item.rowSpan > 1 ? 'none' : undefined,
                                position: 'relative',
                                fontWeight: 700
                              }}
                            >
                              {item.rowSpan > 1 ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
                                  <div style={{
                                    width: '8px',
                                    height: '52px',
                                    border: '2px solid #334155',
                                    borderLeft: 'none',
                                    borderRadius: '0 4px 4px 0',
                                    marginRight: '2px'
                                  }} />
                                  <span style={{ color: '#4f46e5', fontSize: '14px', fontWeight: 800 }}>{item.showTop}</span>
                                </div>
                              ) : item.showTop ? (
                                <span style={{ color: '#4f46e5', fontSize: '14px', fontWeight: 800 }}>{item.showTop}</span>
                              ) : (
                                <span style={{ color: '#aaa' }}>-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="dai-subtotal-row">
                        <td colSpan={3} style={{ fontWeight: 800 }}>Repeat Size</td>
                        <td className="text-right" style={{ fontWeight: 700 }}>{summaryData.warpRepeatSize}</td>
                        <td className="text-right" style={{ color: '#aaa' }}>-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Warp Calculations */}
                <h4 style={{ fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 8, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Warp Calculations</h4>
                <div className="dai-calc-box">
                  <div className="dai-calc-item">
                    <div className="dai-calc-label">Repeat</div>
                    <div className="dai-calc-value">{summaryData.warpRepeatSize} × {summaryData.noD} = {summaryData.repeatEnds}</div>
                  </div>
                  <div className="dai-calc-item">
                    <div className="dai-calc-label">Balance Ends</div>
                    <div className="dai-calc-value">{summaryData.balance}</div>
                  </div>
                  <div className="dai-calc-item">
                    <div className="dai-calc-label">Selvage</div>
                    <div className="dai-calc-value">{summaryData.selvage}</div>
                  </div>
                  <div className="dai-calc-item">
                    <div className="dai-calc-label">Total Ends</div>
                    <div className="dai-calc-value" style={{ color: '#4f46e5' }}>{totalWarpEnds}</div>
                  </div>
                </div>
              </div>

              {/* Weft Design Table */}
              <div className="dai-panel" style={{ padding: 20 }}>
                <h3 className="dai-panel-title">2. Weft Design</h3>
                <div className="dai-table-wrap">
                  <table className="dai-summary-table">
                    <thead>
                      <tr>
                        <th style={{ width: '15%' }}>S.No</th>
                        <th style={{ width: '40%' }}>Count</th>
                        <th style={{ width: '30%' }}>Color</th>
                        <th style={{ width: '15%' }} className="text-right">Threads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.weftDesign.map((item, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{weftCountLabel}</td>
                          <td style={{ color: item.hex, fontWeight: 700 }}>
                            <span className="color-swatch" style={{ background: item.hex, width: 10, height: 10, display: 'inline-block', marginRight: 6, border: '1px solid #ddd', borderRadius: 2 }} />
                            {item.color_name}
                          </td>
                          <td className="text-right" style={{ fontWeight: 600 }}>{item.threads}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="dai-subtotal-row">
                        <td colSpan={3} style={{ fontWeight: 800 }}>Weft Ends</td>
                        <td className="text-right" style={{ fontWeight: 700 }}>{summaryData.weftDesign.reduce((a, b) => a + b.threads, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Design Requirement - Summary Table */}
            <div className="dai-panel" style={{ marginTop: 24 }}>
              <h3 className="dai-panel-title">3. Design Requirement - Summary</h3>
              <div className="dai-table-wrap">
                <table className="dai-summary-table">
                  <thead>
                    <tr>
                      <th>Beam Type</th>
                      <th>Count</th>
                      <th>Color</th>
                      <th className="text-right">Ends</th>
                      <th className="text-right">No D</th>
                      <th className="text-right">Extra</th>
                      <th className="text-right">Total End</th>
                      <th className="text-right">Req Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Warp summary rows */}
                    {summaryData.warpSummary.map((row, i) => (
                      <tr key={`warp-${i}`}>
                        <td><span className="dai-beam-badge warp">{row.beam_type}</span></td>
                        <td>{row.count}</td>
                        <td style={{ color: row.hex, fontWeight: 700 }}>
                          <span className="color-swatch" style={{ background: row.hex, width: 10, height: 10, display: 'inline-block', marginRight: 6, border: '1px solid #ddd', borderRadius: 2 }} />
                          {row.color}
                        </td>
                        <td className="text-right">{row.ends}</td>
                        <td className="text-right">{row.noD}</td>
                        <td className="text-right">{row.extra}</td>
                        <td className="text-right" style={{ fontWeight: 700 }}>{row.total_ends}</td>
                        <td className="text-right" style={{ fontWeight: 700, color: '#4f46e5' }}>{row.req_kg}</td>
                      </tr>
                    ))}
                    <tr className="dai-subtotal-row">
                      <td colSpan={3}>Subtotal (Warp)</td>
                      <td className="text-right">{summaryData.warpRepeatSize}</td>
                      <td colSpan={2}></td>
                      <td className="text-right">{summaryData.warpTotalEnds}</td>
                      <td className="text-right" style={{ color: '#4f46e5' }}>{summaryData.warpTotalKg} kg</td>
                    </tr>

                    {/* Divider row */}
                    <tr><td colSpan={8} style={{ background: '#f1f5f9', height: 6, padding: 0 }}></td></tr>

                    {/* Weft summary rows */}
                    {summaryData.weftSummary.map((row, i) => (
                      <tr key={`weft-${i}`}>
                        <td><span className="dai-beam-badge weft">{row.beam_type}</span></td>
                        <td>{row.count}</td>
                        <td style={{ color: row.hex, fontWeight: 700 }}>
                          <span className="color-swatch" style={{ background: row.hex, width: 10, height: 10, display: 'inline-block', marginRight: 6, border: '1px solid #ddd', borderRadius: 2 }} />
                          {row.color}
                        </td>
                        <td className="text-right">{row.ends}</td>
                        <td className="text-right">{row.noD}</td>
                        <td className="text-right">{row.extra}</td>
                        <td className="text-right" style={{ fontWeight: 700 }}>{row.total_ends}</td>
                        <td className="text-right" style={{ fontWeight: 700, color: '#065f46' }}>{row.req_kg}</td>
                      </tr>
                    ))}
                    <tr className="dai-subtotal-row">
                      <td colSpan={3}>Subtotal (Weft)</td>
                      <td className="text-right">{summaryData.weftDesign.reduce((a, b) => a + b.threads, 0)}</td>
                      <td colSpan={2}></td>
                      <td className="text-right">{summaryData.weftTotalEnds}</td>
                      <td className="text-right" style={{ color: '#065f46' }}>{summaryData.weftTotalKg} kg</td>
                    </tr>

                    {/* Grand Total Row */}
                    <tr className="dai-grandtotal-row">
                      <td colSpan={7} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grand Total Requirement</td>
                      <td className="text-right" style={{ color: '#b45309', fontSize: '15px' }}>{summaryData.grandTotalKg} kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── SAVED DESIGNS DRAWER ─── */}
      {showDrawer && (
        <div className="dai-drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="dai-drawer" onClick={e => e.stopPropagation()}>
            <div className="dai-drawer-header">
              <h3>Saved Fabric Designs</h3>
              <button className="dai-drawer-close" onClick={() => setShowDrawer(false)}>×</button>
            </div>
            <div className="dai-drawer-body">
              {loadingDesigns ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <RefreshCw size={24} className="dai-spin" />
                  <p style={{ marginTop: 8 }}>Loading designs...</p>
                </div>
              ) : savedDesigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <Database size={32} style={{ margin: '0 auto', display: 'block' }} />
                  <p style={{ marginTop: 8 }}>No saved designs found.</p>
                </div>
              ) : (
                <div className="dai-drawer-list">
                  {savedDesigns.map(design => (
                    <div key={design.id} className="dai-drawer-item" onClick={() => handleLoadDesign(design)}>
                      <div className="dai-item-info">
                        <span className="dai-item-no">{design.design_no}</span>
                        <span className="dai-item-name">{design.design_name || 'Unnamed Design'}</span>
                        <div className="dai-item-meta">
                          <span>Weave: {design.weave_type}</span> • <span>Width: {design.loom_width}"</span>
                        </div>
                      </div>
                      <button className="dai-item-del-btn" onClick={e => handleDeleteDesign(design.id, e)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
