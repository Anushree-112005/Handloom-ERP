import React, { useState, useMemo } from 'react';
import {
  Settings, Layers, Activity, FileText, Percent, Truck,
  Scissors, Database, Hash, Calculator, RefreshCw, DollarSign,
  Info, Plus, Trash2, Scale
} from 'lucide-react';

export default function WeavingCalculator() {
  // --- 1. Default Parameters ---
  const [params, setParams] = useState({
    greyReedAdd: 4,
    reedLess: 8,
    fabricWidthReedAdd: 4,
    pickLess: 4,
    warpYarnCalcParam: 1690,
    dyeingLossPct: 5,
  });

  // --- 2. Order & Meterage / Loom Specs ---
  const [specs, setSpecs] = useState({
    orderMtr: 60,
    excessMtr: 0,
    bottomWarpCrimpPct: 10,
    topWarpCrimpPct: 10,
    shrinkagePct: 8,
    finishedReed: 80,
    finishedPick: 72,
    finishedWidth: 53, // In inches
    weftProdMtr: 90,
  });

  // --- 3. Quick Utilities States ---
  // Design Ends
  const [designEndsInput, setDesignEndsInput] = useState({
    requiredMm: 3,
    finishedReed: 80,
  });
  // Resultant Count
  const [resultantCountInput, setResultantCountInput] = useState({
    singleCount: 60,
    plies: 2,
  });
  // Dyeing Loss Tracker
  const [dyeingTracker, setDyeingTracker] = useState({
    issuedKgs: 192.56,
    receivedKgs: 186.70,
  });
  // Weaving Crimp Tracker
  const [weavingCrimpTracker, setWeavingCrimpTracker] = useState({
    warpMtr: 120,
    weavMtr: 110,
  });
  // Processing Shrinkage Tracker
  const [procShrinkageTracker, setProcShrinkageTracker] = useState({
    greyMtr: 3689.7,
    processedMtr: 3364.2,
  });
  // GSM/GLM Custom Calculator
  const [gsmInput, setGsmInput] = useState({
    epi: 80,
    ppi: 72,
    warpCount: 20,
    weftCount: 20,
    fabricWidth: 60,
  });
  // GST Calculator
  const [gstInput, setGstInput] = useState({
    taxableValue: 10000,
    isInterState: false, // false = Intra-State (5%), true = Inter-State (18%)
  });

  // --- 4. Warp Yarn Table ---
  const [warpYarns, setWarpYarns] = useState([
    { id: 1, colour: 'CREAM', count: 20, plies: 1, ends: 1235, warpMtrOverride: '' },
    { id: 2, colour: 'L.GREY', count: 20, plies: 1, ends: 298, warpMtrOverride: '' },
    { id: 3, colour: 'D.GREY', count: 20, plies: 1, ends: 885, warpMtrOverride: '' },
    { id: 4, colour: 'BLACK', count: 20, plies: 1, ends: 546, warpMtrOverride: '' },
  ]);

  // --- 5. Weft Yarn Table ---
  const [weftYarns, setWeftYarns] = useState([
    { id: 1, colour: 'CREAM', count: 20, plies: 1, picks: 70 },
    { id: 2, colour: 'L.GREY', count: 20, plies: 1, picks: 14 },
    { id: 3, colour: 'D.GREY', count: 20, plies: 1, picks: 48 },
    { id: 4, colour: 'BLACK', count: 20, plies: 1, picks: 30 },
  ]);

  // --- Calculations ---

  // Meterage
  const totalOrderMtr = useMemo(() => {
    return Number(specs.orderMtr) + Number(specs.excessMtr || 0);
  }, [specs.orderMtr, specs.excessMtr]);

  const warpMtrBottom = useMemo(() => {
    return Number((totalOrderMtr * (1 + Number(specs.bottomWarpCrimpPct) / 100 + Number(specs.shrinkagePct) / 100)).toFixed(2));
  }, [totalOrderMtr, specs.bottomWarpCrimpPct, specs.shrinkagePct]);

  const topWarpMtr = useMemo(() => {
    return Number((totalOrderMtr * (1 + Number(specs.topWarpCrimpPct) / 100 + Number(specs.shrinkagePct) / 100)).toFixed(2));
  }, [totalOrderMtr, specs.topWarpCrimpPct, specs.shrinkagePct]);

  // Reed
  const onloomReed = useMemo(() => {
    return Number(specs.finishedReed) - Number(params.reedLess);
  }, [specs.finishedReed, params.reedLess]);

  const greyReed = useMemo(() => {
    return onloomReed + Number(params.greyReedAdd);
  }, [onloomReed, params.greyReedAdd]);

  const onloomPick = useMemo(() => {
    return Number(specs.finishedPick) - Number(params.pickLess);
  }, [specs.finishedPick, params.pickLess]);

  const totalEndsManual = useMemo(() => {
    return Number(specs.finishedReed) * Number(specs.finishedWidth);
  }, [specs.finishedReed, specs.finishedWidth]);

  const totalEndsAuto = useMemo(() => {
    return Number(specs.finishedReed) * (Number(specs.finishedWidth) + Number(params.fabricWidthReedAdd));
  }, [specs.finishedReed, specs.finishedWidth, params.fabricWidthReedAdd]);

  const reedSpace = useMemo(() => {
    return onloomReed > 0 ? Number((totalEndsAuto / onloomReed).toFixed(2)) : 0;
  }, [totalEndsAuto, onloomReed]);

  const fabricWidthGrey = useMemo(() => {
    return greyReed > 0 ? Number((totalEndsAuto / greyReed).toFixed(2)) : 0;
  }, [totalEndsAuto, greyReed]);

  // Warp Yarns Calculations
  const calculatedWarpYarns = useMemo(() => {
    return warpYarns.map(yarn => {
      const resultantCount = yarn.plies > 0 ? yarn.count / yarn.plies : yarn.count;
      const mtr = yarn.warpMtrOverride !== '' ? Number(yarn.warpMtrOverride) : warpMtrBottom;
      const reqKgs = resultantCount > 0 ? (yarn.ends * 1.094 / 1848 / resultantCount) * mtr : 0;
      const withLoss = reqKgs / (1 - Number(params.dyeingLossPct) / 100);
      return {
        ...yarn,
        resultantCount,
        warpMtrUsed: mtr,
        reqKgs: Number(reqKgs.toFixed(2)),
        withLoss: Number(withLoss.toFixed(2)),
        rounded: Math.round(withLoss),
      };
    });
  }, [warpYarns, warpMtrBottom, params.dyeingLossPct]);

  const warpSummary = useMemo(() => {
    return calculatedWarpYarns.reduce((sum, item) => {
      sum.ends += Number(item.ends || 0);
      sum.reqKgs += item.reqKgs;
      sum.withLoss += item.withLoss;
      sum.rounded += item.rounded;
      return sum;
    }, { ends: 0, reqKgs: 0, withLoss: 0, rounded: 0 });
  }, [calculatedWarpYarns]);

  // Weft Yarns Calculations
  const weftEnds = useMemo(() => {
    return Number((onloomPick * (reedSpace + 3)).toFixed(2));
  }, [onloomPick, reedSpace]);

  const totalWeftPicks = useMemo(() => {
    return weftYarns.reduce((sum, item) => sum + Number(item.picks || 0), 0);
  }, [weftYarns]);

  const calculatedWeftYarns = useMemo(() => {
    return weftYarns.map(yarn => {
      const resultantCount = yarn.plies > 0 ? yarn.count / yarn.plies : yarn.count;
      const ratio = totalWeftPicks > 0 ? yarn.picks / totalWeftPicks : 0;
      
      const groupEnds = Math.round(weftEnds * ratio);
      const reqKgs = resultantCount > 0 
        ? (groupEnds * Number(specs.weftProdMtr)) / (1690 * resultantCount)
        : 0;
        
      const withLoss = reqKgs / (1 - Number(params.dyeingLossPct) / 100);
      return {
        ...yarn,
        resultantCount,
        ratio,
        reqKgs: Number(reqKgs.toFixed(2)),
        withLoss: Number(withLoss.toFixed(2)),
        rounded: Math.round(withLoss),
      };
    });
  }, [weftYarns, totalWeftPicks, weftEnds, specs.weftProdMtr, params.dyeingLossPct]);

  const weftSummary = useMemo(() => {
    return calculatedWeftYarns.reduce((sum, item) => {
      sum.picks += Number(item.picks || 0);
      sum.reqKgs += item.reqKgs;
      sum.withLoss += item.withLoss;
      sum.rounded += item.rounded;
      return sum;
    }, { picks: 0, reqKgs: 0, withLoss: 0, rounded: 0 });
  }, [calculatedWeftYarns]);

  // Design Ends
  const calculatedRequiredEnds = useMemo(() => {
    const { requiredMm, finishedReed } = designEndsInput;
    if (!requiredMm || !finishedReed) return 0;
    return Math.ceil((Number(requiredMm) / 25.4) * Number(finishedReed));
  }, [designEndsInput]);

  // Resultant Count
  const calculatedResultantCount = useMemo(() => {
    const { singleCount, plies } = resultantCountInput;
    if (!singleCount || !plies) return 0;
    return Number((Number(singleCount) / Number(plies)).toFixed(2));
  }, [resultantCountInput]);

  // Dyeing Loss Actual Tracker
  const calculatedActualDyeingLoss = useMemo(() => {
    const { issuedKgs, receivedKgs } = dyeingTracker;
    const balance = Number(issuedKgs) - Number(receivedKgs);
    const lossPct = issuedKgs > 0 ? (balance / Number(issuedKgs)) * 100 : 0;
    return {
      balance: Number(balance.toFixed(2)),
      lossPct: Number(lossPct.toFixed(2)),
    };
  }, [dyeingTracker]);

  // Weaving Crimp Actual Tracker
  const calculatedWeavingCrimpPct = useMemo(() => {
    const { warpMtr, weavMtr } = weavingCrimpTracker;
    if (!warpMtr) return 0;
    return Number(((Number(warpMtr) - Number(weavMtr)) / Number(warpMtr) * 100).toFixed(2));
  }, [weavingCrimpTracker]);

  // Processing Shrinkage Actual Tracker
  const calculatedProcessingShrinkagePct = useMemo(() => {
    const { greyMtr, processedMtr } = procShrinkageTracker;
    if (!greyMtr) return 0;
    return Number(((Number(greyMtr) - Number(processedMtr)) / Number(greyMtr) * 100).toFixed(2));
  }, [procShrinkageTracker]);

  // GSM and GLM
  const calculatedGsmGlm = useMemo(() => {
    const { epi, ppi, warpCount, weftCount, fabricWidth } = gsmInput;
    if (!warpCount || !weftCount) return { gsm: 0, glm: 0 };
    const gsm = ((Number(epi) / Number(warpCount)) + (Number(ppi) / Number(weftCount))) * 25.4;
    const glm = gsm * (Number(fabricWidth) / 39.37);
    return {
      gsm: Number(gsm.toFixed(2)),
      glm: Number(glm.toFixed(2)),
    };
  }, [gsmInput]);

  // GST
  const calculatedGst = useMemo(() => {
    const val = Number(gstInput.taxableValue || 0);
    if (gstInput.isInterState) {
      const igst = val * 0.18;
      return {
        cgst: 0,
        sgst: 0,
        igst: Number(igst.toFixed(2)),
        totalTax: Number(igst.toFixed(2)),
        grandTotal: Number((val + igst).toFixed(2)),
      };
    } else {
      const cgst = val * 0.025;
      const sgst = val * 0.025;
      const totalTax = cgst + sgst;
      return {
        cgst: Number(cgst.toFixed(2)),
        sgst: Number(sgst.toFixed(2)),
        igst: 0,
        totalTax: Number(totalTax.toFixed(2)),
        grandTotal: Number((val + totalTax).toFixed(2)),
      };
    }
  }, [gstInput]);

  // Bale Packing Tolerance
  const baleTolerance = useMemo(() => {
    const order = Number(specs.orderMtr);
    const tolMtr = order * 0.08;
    return {
      min: Number((order - tolMtr).toFixed(2)),
      max: Number((order + tolMtr).toFixed(2)),
      tolMtr: Number(tolMtr.toFixed(2)),
    };
  }, [specs.orderMtr]);

  // Handlers
  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setSpecs(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  // Warp Yarns CRUD
  const updateWarpYarn = (id, field, val) => {
    setWarpYarns(prev => prev.map(y => y.id === id ? { ...y, [field]: val === '' ? '' : (field === 'colour' ? val : Number(val)) } : y));
  };

  const addWarpRow = () => {
    const newId = warpYarns.length > 0 ? Math.max(...warpYarns.map(y => y.id)) + 1 : 1;
    setWarpYarns(prev => [...prev, { id: newId, colour: 'NEW COLOR', count: 20, plies: 1, ends: 100, warpMtrOverride: '' }]);
  };

  const deleteWarpRow = (id) => {
    setWarpYarns(prev => prev.filter(y => y.id !== id));
  };

  // Weft Yarns CRUD
  const updateWeftYarn = (id, field, val) => {
    setWeftYarns(prev => prev.map(y => y.id === id ? { ...y, [field]: val === '' ? '' : (field === 'colour' ? val : Number(val)) } : y));
  };

  const addWeftRow = () => {
    const newId = weftYarns.length > 0 ? Math.max(...weftYarns.map(y => y.id)) + 1 : 1;
    setWeftYarns(prev => [...prev, { id: newId, colour: 'NEW COLOR', count: 20, plies: 1, picks: 10 }]);
  };

  const deleteWeftRow = (id) => {
    setWeftYarns(prev => prev.filter(y => y.id !== id));
  };

  return (
    <div className="weaving-calculator-page animate-fade" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calculator size={28} style={{ color: 'var(--primary)' }} />
            Weaving Yarn Calculation Guide & Calculator
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Interactive mathematical engine implementing formulas from WEAVING_YARN_CALCULATION_GUIDE.docx.
          </p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ '--stat-color': '#4f46e5' }}>
          <div className="stat-icon purple"><Layers size={22} /></div>
          <div className="stat-info">
            <h3>{totalEndsAuto}</h3>
            <p>Total Ends (Auto Calculation)</p>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#0891b2' }}>
          <div className="stat-icon cyan"><Settings size={22} /></div>
          <div className="stat-info">
            <h3>{reedSpace} "</h3>
            <p>On-Loom Reed Space</p>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#059669' }}>
          <div className="stat-icon emerald"><Activity size={22} /></div>
          <div className="stat-info">
            <h3>{warpMtrBottom} m</h3>
            <p>Warp Metres Required</p>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#d97706' }}>
          <div className="stat-icon amber"><Scissors size={22} /></div>
          <div className="stat-info">
            <h3>{weftEnds}</h3>
            <p>Weft Ends (Selvage Incl.)</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {/* Left Column: Parameter configurations & inputs */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Baseline settings */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Settings size={18} style={{ color: 'var(--primary)' }} />
              1. Baseline Parameters (Constants)
            </h3>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Grey Reed Add</label>
                <input type="number" className="form-control" name="greyReedAdd" value={params.greyReedAdd} onChange={handleParamChange} />
              </div>
              <div className="form-group">
                <label>Reed Less</label>
                <input type="number" className="form-control" name="reedLess" value={params.reedLess} onChange={handleParamChange} />
              </div>
            </div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '8px' }}>
              <div className="form-group">
                <label>Fabric Width Reed Add</label>
                <input type="number" className="form-control" name="fabricWidthReedAdd" value={params.fabricWidthReedAdd} onChange={handleParamChange} />
              </div>
              <div className="form-group">
                <label>Pick Less</label>
                <input type="number" className="form-control" name="pickLess" value={params.pickLess} onChange={handleParamChange} />
              </div>
            </div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '8px' }}>
              <div className="form-group">
                <label>Warp Calc Constant</label>
                <input type="number" className="form-control" name="warpYarnCalcParam" value={params.warpYarnCalcParam} onChange={handleParamChange} />
              </div>
              <div className="form-group">
                <label>Dyeing Loss %</label>
                <input type="number" className="form-control" name="dyeingLossPct" value={params.dyeingLossPct} onChange={handleParamChange} />
              </div>
            </div>
          </div>

          {/* Section 2: Loom Specs & Inputs */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Database size={18} style={{ color: 'var(--primary)' }} />
              2. Order Specs & Loom Inputs
            </h3>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Order Mtr</label>
                <input type="number" className="form-control" name="orderMtr" value={specs.orderMtr} onChange={handleSpecChange} />
              </div>
              <div className="form-group">
                <label>Excess Mtr</label>
                <input type="number" className="form-control" name="excessMtr" value={specs.excessMtr} onChange={handleSpecChange} />
              </div>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '8px' }}>
              <div className="form-group">
                <label>Btm Crimp %</label>
                <input type="number" className="form-control" name="bottomWarpCrimpPct" value={specs.bottomWarpCrimpPct} onChange={handleSpecChange} />
              </div>
              <div className="form-group">
                <label>Top Crimp %</label>
                <input type="number" className="form-control" name="topWarpCrimpPct" value={specs.topWarpCrimpPct} onChange={handleSpecChange} />
              </div>
              <div className="form-group">
                <label>Shrinkage %</label>
                <input type="number" className="form-control" name="shrinkagePct" value={specs.shrinkagePct} onChange={handleSpecChange} />
              </div>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '8px' }}>
              <div className="form-group">
                <label>Finished Reed</label>
                <input type="number" className="form-control" name="finishedReed" value={specs.finishedReed} onChange={handleSpecChange} />
              </div>
              <div className="form-group">
                <label>Finished Pick</label>
                <input type="number" className="form-control" name="finishedPick" value={specs.finishedPick} onChange={handleSpecChange} />
              </div>
              <div className="form-group">
                <label>Finish Width (")</label>
                <input type="number" className="form-control" name="finishedWidth" value={specs.finishedWidth} onChange={handleSpecChange} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '8px' }}>
              <label>Weft Production Metres (Weft Prod Mtr)</label>
              <input type="number" className="form-control" name="weftProdMtr" value={specs.weftProdMtr} onChange={handleSpecChange} />
            </div>
          </div>

          {/* Section 3: Quick Utilities */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Hash size={18} style={{ color: 'var(--primary)' }} />
              3. Quick Calculation Utilities
            </h3>
            
            {/* Design Ends Tool */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                Design Ends Finding (MM → Ends)
              </span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required MM</label>
                  <input type="number" className="form-control" style={{ padding: '6px 10px' }} value={designEndsInput.requiredMm} onChange={e => setDesignEndsInput(prev => ({ ...prev, requiredMm: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Finished Reed</label>
                  <input type="number" className="form-control" style={{ padding: '6px 10px' }} value={designEndsInput.finishedReed} onChange={e => setDesignEndsInput(prev => ({ ...prev, finishedReed: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1, paddingBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {calculatedRequiredEnds} ends
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Formula: (Req MM / 25.4) * Finished Reed (Rounded Up)
              </span>
            </div>

            {/* Resultant Count Tool */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                Resultant Count (Ply Thickness)
              </span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Single Count</label>
                  <input type="number" className="form-control" style={{ padding: '6px 10px' }} value={resultantCountInput.singleCount} onChange={e => setResultantCountInput(prev => ({ ...prev, singleCount: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Plies</label>
                  <input type="number" className="form-control" style={{ padding: '6px 10px' }} value={resultantCountInput.plies} onChange={e => setResultantCountInput(prev => ({ ...prev, plies: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1, paddingBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {calculatedResultantCount}s
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Formula: Single Yarn Count / Number of Plies
              </span>
            </div>

            {/* Dyeing Loss Tracker Tool */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                Dyehouse Real Loss Monitor
              </span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Issued Kgs</label>
                  <input type="number" step="any" className="form-control" style={{ padding: '6px 10px' }} value={dyeingTracker.issuedKgs} onChange={e => setDyeingTracker(prev => ({ ...prev, issuedKgs: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Received Kgs</label>
                  <input type="number" step="any" className="form-control" style={{ padding: '6px 10px' }} value={dyeingTracker.receivedKgs} onChange={e => setDyeingTracker(prev => ({ ...prev, receivedKgs: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1.2, paddingBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)', display: 'block' }}>
                    Loss: {calculatedActualDyeingLoss.lossPct}%
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Bal: {calculatedActualDyeingLoss.balance} kgs
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Formula: (Issued - Received) / Issued x 100
              </span>
            </div>

          </div>

        </div>

        {/* Right Column: Calculated Results */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 4: Calculated Reed & Loom Settings */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              4. Calculated Reed & Loom Settings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Onloom Reed</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{onloomReed}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Reed - {params.reedLess}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Grey Reed</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{greyReed}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Onloom + {params.greyReedAdd}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Onloom Pick</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{onloomPick}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Pick - {params.pickLess}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Grey Fabric Width</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{fabricWidthGrey} "</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Ends / Grey Reed</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
              <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Total Ends (Manual)</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{totalEndsManual}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Reed x Width</span>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(79, 70, 229, 0.03)' }}>
                <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Total Ends (Auto)</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)' }}>{totalEndsAuto}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Reed x (Width + {params.fabricWidthReedAdd})</span>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Reed Space</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{reedSpace} inches</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Ends (Auto) / Onloom Reed</span>
              </div>
            </div>
          </div>

          {/* Section 5: Warp Yarn Calculations Table */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', margin: 0 }}>
                <Database size={18} style={{ color: 'var(--primary)' }} />
                5. Warp Yarn Calculations (KGS)
              </h3>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={addWarpRow}>
                <Plus size={14} /> Add Color
              </button>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colour</th>
                  <th>Count</th>
                  <th>Plies</th>
                  <th>Resultant</th>
                  <th>Ends</th>
                  <th>Warp Mtr</th>
                  <th>Req Kgs</th>
                  <th>Dyeing Loss ({params.dyeingLossPct}%)</th>
                  <th>Rounded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {calculatedWarpYarns.map(yarn => (
                  <tr key={yarn.id}>
                    <td>
                      <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: '13px' }} value={yarn.colour} onChange={e => updateWarpYarn(yarn.id, 'colour', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '13px', width: '70px' }} value={yarn.count} onChange={e => updateWarpYarn(yarn.id, 'count', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '13px', width: '50px' }} value={yarn.plies} onChange={e => updateWarpYarn(yarn.id, 'plies', e.target.value)} />
                    </td>
                    <td style={{ fontWeight: '600' }}>{yarn.resultantCount}s</td>
                    <td>
                      <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '13px', width: '80px' }} value={yarn.ends} onChange={e => updateWarpYarn(yarn.id, 'ends', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '13px', width: '90px' }} placeholder={warpMtrBottom} value={yarn.warpMtrOverride} onChange={e => updateWarpYarn(yarn.id, 'warpMtrOverride', e.target.value)} />
                    </td>
                    <td style={{ fontWeight: '600' }}>{yarn.reqKgs}</td>
                    <td>{yarn.withLoss}</td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{yarn.rounded} KGS</td>
                    <td>
                      <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => deleteWarpRow(yarn.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Warp Summary Row */}
                <tr style={{ background: 'var(--bg-secondary)', fontWeight: '700' }}>
                  <td>TOTAL</td>
                  <td colSpan="3"></td>
                  <td>{warpSummary.ends}</td>
                  <td>-</td>
                  <td>{warpSummary.reqKgs.toFixed(2)}</td>
                  <td>{warpSummary.withLoss.toFixed(2)}</td>
                  <td style={{ color: 'var(--primary)', fontSize: '15px' }}>{warpSummary.rounded} KGS</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Formula: REQ KGS = (Ends x 1.094) / (1848 x Count) x Warp Mtr
            </div>
          </div>

          {/* Section 6: Weft Yarn Calculations Table */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', margin: 0 }}>
                <Scissors size={18} style={{ color: 'var(--primary)' }} />
                6. Weft Yarn Calculations (KGS)
              </h3>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={addWeftRow}>
                <Plus size={14} /> Add Color
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', background: 'var(--bg-primary)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weft Ends (Onloom Pick x [Reed Space + 3"]):</span>
                <strong style={{ marginLeft: '6px' }}>{weftEnds}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weft Prod Mtr:</span>
                <strong style={{ marginLeft: '6px' }}>{specs.weftProdMtr} m</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Picks:</span>
                <strong style={{ marginLeft: '6px' }}>{totalWeftPicks}</strong>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Colour</th>
                  <th>Count</th>
                  <th>Plies</th>
                  <th>Resultant</th>
                  <th>Colour Picks</th>
                  <th>Pattern Ratio</th>
                  <th>Req Kgs</th>
                  <th>Dyeing Loss ({params.dyeingLossPct}%)</th>
                  <th>Rounded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {calculatedWeftYarns.map(yarn => (
                  <tr key={yarn.id}>
                    <td>
                      <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: '13px' }} value={yarn.colour} onChange={e => updateWeftYarn(yarn.id, 'colour', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '13px', width: '70px' }} value={yarn.count} onChange={e => updateWeftYarn(yarn.id, 'count', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '13px', width: '50px' }} value={yarn.plies} onChange={e => updateWeftYarn(yarn.id, 'plies', e.target.value)} />
                    </td>
                    <td style={{ fontWeight: '600' }}>{yarn.resultantCount}s</td>
                    <td>
                      <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '13px', width: '80px' }} value={yarn.picks} onChange={e => updateWeftYarn(yarn.id, 'picks', e.target.value)} />
                    </td>
                    <td>{(yarn.ratio * 100).toFixed(1)}%</td>
                    <td style={{ fontWeight: '600' }}>{yarn.reqKgs}</td>
                    <td>{yarn.withLoss}</td>
                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{yarn.rounded} KGS</td>
                    <td>
                      <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => deleteWeftRow(yarn.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Weft Summary Row */}
                <tr style={{ background: 'var(--bg-secondary)', fontWeight: '700' }}>
                  <td>TOTAL</td>
                  <td colSpan="3"></td>
                  <td>{weftSummary.picks}</td>
                  <td>100%</td>
                  <td>{weftSummary.reqKgs.toFixed(2)}</td>
                  <td>{weftSummary.withLoss.toFixed(2)}</td>
                  <td style={{ color: 'var(--primary)', fontSize: '15px' }}>{weftSummary.rounded} KGS</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Formula: REQ KGS = (Group Weft Ends x 1.094 x Weft Prod Mtr) / (1848 x Count) where Group Weft Ends = (Colour Picks / Total Picks) x Onloom Pick x (Reed Space + 3)
            </div>
          </div>

          {/* Section 7: Fabric Weight & Weaving / Shrinkage Monitoring */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* GSM/GLM Card */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                <Activity size={16} style={{ color: 'var(--primary)' }} />
                7. GSM & GLM Weight Estimation
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>EPI</label>
                  <input type="number" className="form-control" style={{ padding: '6px' }} value={gsmInput.epi} onChange={e => setGsmInput(prev => ({ ...prev, epi: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>PPI</label>
                  <input type="number" className="form-control" style={{ padding: '6px' }} value={gsmInput.ppi} onChange={e => setGsmInput(prev => ({ ...prev, ppi: Number(e.target.value) }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Warp Count</label>
                  <input type="number" className="form-control" style={{ padding: '6px' }} value={gsmInput.warpCount} onChange={e => setGsmInput(prev => ({ ...prev, warpCount: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Weft Count</label>
                  <input type="number" className="form-control" style={{ padding: '6px' }} value={gsmInput.weftCount} onChange={e => setGsmInput(prev => ({ ...prev, weftCount: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Width (")</label>
                  <input type="number" className="form-control" style={{ padding: '6px' }} value={gsmInput.fabricWidth} onChange={e => setGsmInput(prev => ({ ...prev, fabricWidth: Number(e.target.value) }))} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)', marginTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>GSM (g/m²)</span>
                  <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>{calculatedGsmGlm.gsm} gsm</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>GLM (g/m)</span>
                  <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>{calculatedGsmGlm.glm} glm</strong>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                GSM = ((EPI / WarpCount) + (PPI / WeftCount)) * 25.4
              </span>
            </div>

            {/* Weaving Crimp & Shrinkage Tracker Card */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                <Percent size={16} style={{ color: 'var(--primary)' }} />
                8. Actual Weave & Process Loss Tracker
              </h3>
              
              {/* Weaving Crimp Tracker */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Weaving Crimp %
                </span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Warp Mtr</label>
                    <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '12px' }} value={weavingCrimpTracker.warpMtr} onChange={e => setWeavingCrimpTracker(prev => ({ ...prev, warpMtr: Number(e.target.value) }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Weav Mtr</label>
                    <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '12px' }} value={weavingCrimpTracker.weavMtr} onChange={e => setWeavingCrimpTracker(prev => ({ ...prev, weavMtr: Number(e.target.value) }))} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: '4px', textAlign: 'right' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>{calculatedWeavingCrimpPct}%</strong>
                  </div>
                </div>
              </div>

              {/* Processing Shrinkage Tracker */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Processing Shrinkage %
                </span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Grey Mtr</label>
                    <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '12px' }} value={procShrinkageTracker.greyMtr} onChange={e => setProcShrinkageTracker(prev => ({ ...prev, greyMtr: Number(e.target.value) }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Processed Mtr</label>
                    <input type="number" className="form-control" style={{ padding: '4px 8px', fontSize: '12px' }} value={procShrinkageTracker.processedMtr} onChange={e => setProcShrinkageTracker(prev => ({ ...prev, processedMtr: Number(e.target.value) }))} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: '4px', textAlign: 'right' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>{calculatedProcessingShrinkagePct}%</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Section 8: GST Invoice & Packing Tolerances */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            
            {/* GST Card */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                <DollarSign size={16} style={{ color: 'var(--primary)' }} />
                9. Goods & Services Tax (GST) Calculator
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1.5 }} className="form-group">
                  <label>Taxable Value (INR)</label>
                  <input type="number" className="form-control" value={gstInput.taxableValue} onChange={e => setGstInput(prev => ({ ...prev, taxableValue: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1 }} className="form-group">
                  <label>GST Type</label>
                  <select className="form-control" value={gstInput.isInterState ? 'inter' : 'intra'} onChange={e => setGstInput(prev => ({ ...prev, isInterState: e.target.value === 'inter' }))}>
                    <option value="intra">Intra-State (5%)</option>
                    <option value="inter">Inter-State (18%)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                {!gstInput.isInterState ? (
                  <>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SGST (2.5%)</span>
                      <div style={{ fontWeight: '700' }}>₹ {calculatedGst.sgst}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CGST (2.5%)</span>
                      <div style={{ fontWeight: '700' }}>₹ {calculatedGst.cgst}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IGST (18%)</span>
                    <div style={{ fontWeight: '700' }}>₹ {calculatedGst.igst}</div>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Grand Total:</span>
                  <strong style={{ fontSize: '15px', color: 'var(--success)' }}>₹ {calculatedGst.grandTotal}</strong>
                </div>
              </div>
            </div>

            {/* Packing Tolerance Card */}
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                <Scale size={16} style={{ color: 'var(--primary)' }} />
                10. Bale Packing & Dispatch Tolerance
              </h3>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base Order Qty:</span>
                  <strong>{specs.orderMtr} mtr</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tolerance Value (+/- 8%):</span>
                  <strong>{baleTolerance.tolMtr} mtr</strong>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min Dispatch Limit:</span>
                  <strong style={{ color: 'var(--danger)' }}>{baleTolerance.min} mtr</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Dispatch Limit:</span>
                  <strong style={{ color: 'var(--success)' }}>{baleTolerance.max} mtr</strong>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
