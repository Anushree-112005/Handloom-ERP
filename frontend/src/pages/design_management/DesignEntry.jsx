import React, { useEffect, useState, useRef } from 'react';

import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Palette, Users, FileText, Layers, CheckSquare, Download, ChevronDown, ArrowLeft, CheckCircle } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { designEntryAPI, partyAPI, employeeAPI, buyerOrderAPI, subMasterAPI, textileDesignAPI, dropdownAPI, getBackendURL } from '../../services/api';
import SubMasterDropdown from '../../components/SubMasterDropdown';
import { confirmDialog } from '../../utils/dialogs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

const getColorHex = (colorName, colorMastersList) => {
  if (!colorName || typeof colorName !== 'string') return '#cbd5e1';
  const cname = colorName.trim().toLowerCase();
  const colorMap = {
    'white': '#ffffff',
    'off white': '#f8f9fa',
    'cream': '#fdf5e6',
    'khaki': '#c3b091',
    'olive': '#808000',
    'olive green': '#556b2f',
    'l.brown': '#b5651d',
    'd.brown': '#5c4033',
    'light brown': '#b5651d',
    'dark brown': '#5c4033',
    'brown': '#8b4513',
    'navy': '#000080',
    'navy blue': '#000080',
    'red': '#ff0000',
    'd.blue': '#0047ab',
    'd. blue': '#0047ab',
    'dark blue': '#0047ab',
    'h.white': '#f5f5f5',
    'half white': '#f5f5f5',
    'scarlet red': '#ff2400',
    'grey': '#808080',
    'gray': '#808080',
    'charcoal': '#36454f',
    'charcoal grey': '#36454f',
    'charcoal gray': '#36454f',
    'black': '#000000',
    'jet black': '#0a0a0a',
    'blue': '#0000ff',
    'royal blue': '#4169e1',
    'emerald': '#50c878',
    'emerald green': '#50c878',
    'yellow': '#ffff00',
    'mustard': '#e1ad01',
    'mustard yellow': '#e1ad01',
    'pink': '#ffc0cb',
    'coral pink': '#f88379',
    'orange': '#ffa500'
  };

  if (colorMap[cname]) return colorMap[cname];

  if (colorMastersList && colorMastersList.length > 0) {
    const match = colorMastersList.find(c => 
      c && c.name && (
        c.name.toLowerCase() === cname || 
        c.name.toLowerCase().includes(cname) || 
        cname.includes(c.name.toLowerCase())
      )
    );
    if (match && match.code && typeof match.code === 'string') {
      const code = match.code.trim();
      if (code.startsWith('#') || colorMap[code.toLowerCase()]) {
        return code;
      }
      if (colorMap[code.toLowerCase()]) {
        return colorMap[code.toLowerCase()];
      }
    }
  }

  const cssColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey', 'olive', 'lime', 'teal', 'navy'];
  if (cssColors.includes(cname)) return cname;

  return '#cbd5e1';
};

const getRowSpans = (rows, key) => {
  const spans = [];
  let i = 0;
  while (i < rows.length) {
    const val = rows[i][key];
    const type = rows[i].type;
    
    // If the value is "1", empty, or falsy, do not group
    if (!val || val === '1' || (key === 'drawing_order' && String(val).trim() === '')) {
      spans.push({ span: 1, isStart: true, value: val });
      i++;
      continue;
    }
    
    // Find consecutive rows of the same type with the same column value
    let count = 1;
    while (
      i + count < rows.length && 
      rows[i + count].type === type && 
      rows[i + count][key] === val
    ) {
      count++;
    }
    
    spans.push({ span: count, isStart: true, value: val });
    for (let j = 1; j < count; j++) {
      spans.push({ span: count, isStart: false, value: val });
    }
    i += count;
  }
  return spans;
};

const parseEqCount = (lbl) => {
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
  const key = (lbl || '').trim().toUpperCase();
  if (YARN_COUNTS[key] !== undefined) return YARN_COUNTS[key];
  if (!lbl) return 20.0;
  let cleaned = key.replace(/\s+/g, '');
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    const ply = parseFloat(parts[0]) || 1.0;
    const countPart = parts[1].match(/\d+/);
    const count = countPart ? parseFloat(countPart[0]) : 40.0;
    return count / ply;
  } else {
    const match = cleaned.match(/\d+/);
    return match ? parseFloat(match[0]) : 20.0;
  }
};

const calculateRepeatSize = (rows) => {
  let total = 0;
  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    const val = r.times;
    const type = r.type;
    
    // If the value is empty, "1", or falsy, do not group. Just add row's threads.
    if (!val || val === '1' || val === '') {
      total += parseInt(r.threads) || 0;
      i++;
      continue;
    }
    
    // Find consecutive rows of the same type with the same times value
    let count = 1;
    let groupThreads = parseInt(r.threads) || 0;
    while (
      i + count < rows.length && 
      rows[i + count].type === type &&
      rows[i + count].times === val
    ) {
      groupThreads += parseInt(rows[i + count].threads) || 0;
      count++;
    }
    
    const timesMultiplier = parseInt(val) || 1;
    total += groupThreads * timesMultiplier;
    i += count;
  }
  return total;
};

const renderBracketCell = (value, span, hasBorder = false) => {
  if (span <= 1) {
    return <td style={hasBorder ? { padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' } : {}}>{value || '-'}</td>;
  }
  
  const topPercent = `${(0.5 / span) * 100}%`;
  const bottomPercent = `${(0.5 / span) * 100}%`;
  
  return (
    <td 
      rowSpan={span} 
      style={{ 
        verticalAlign: 'middle', 
        textAlign: 'center', 
        padding: '4px 8px',
        backgroundColor: '#ffffff',
        border: hasBorder ? '1px solid #ccc' : undefined
      }}
    >
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        paddingLeft: 22,
        height: '100%',
        minHeight: span * 24 - 8,
        width: '100%'
      }}>
        {/* Bracket Graphic container */}
        <div style={{ 
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 16
        }}>
          {/* Top horizontal tick pointing left */}
          <div style={{
            position: 'absolute',
            top: topPercent,
            left: 0,
            right: 2,
            height: 1.5,
            background: '#4b5563'
          }} />
          {/* Vertical line connecting top to bottom (on the right) */}
          <div style={{
            position: 'absolute',
            top: topPercent,
            bottom: bottomPercent,
            right: 2,
            width: 1.5,
            background: '#4b5563'
          }} />
          {/* Bottom horizontal tick pointing left */}
          <div style={{
            position: 'absolute',
            bottom: bottomPercent,
            left: 0,
            right: 2,
            height: 1.5,
            background: '#4b5563'
          }} />
          {/* Middle horizontal line pointing right to the text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: -8,
            width: 10,
            height: 1.5,
            transform: 'translateY(-50%)',
            background: '#4b5563'
          }} />
        </div>
        
        {/* Bracket value text */}
        <span style={{ 
          fontWeight: 600, 
          fontSize: 11,
          color: '#1f2937',
          paddingLeft: 4,
          whiteSpace: 'nowrap'
        }}>
          {value}
        </span>
      </div>
    </td>
  );
};

function DesignSheetModal({ isOpen, onClose, design, colorMasters }) {
  const [downloading, setDownloading] = useState(false);
  if (!isOpen || !design) return null;

  // 1. Parse details
  let yarnRows = [];
  try {
    yarnRows = design.yarn_details ? JSON.parse(design.yarn_details) : [];
  } catch (e) {
    console.error("Error parsing yarn_details", e);
  }

  let fabricDesignRows = [];
  try {
    fabricDesignRows = design.fabric_design_details ? JSON.parse(design.fabric_design_details) : [];
  } catch (e) {
    console.error("Error parsing fabric_design_details", e);
  }

  const warpRows = fabricDesignRows.filter(r => r.type && !r.type.toLowerCase().includes('weft'));
  const weftRows = fabricDesignRows.filter(r => r.type && r.type.toLowerCase().includes('weft'));

  // 2. Calculations
  const warpRepeatSize = calculateRepeatSize(warpRows);
  const weftRepeatSize = calculateRepeatSize(weftRows);

  const totalEnds = parseFloat(design.total_ends) || 0;
  const selvage = parseFloat(design.selvage_waste) || 0;
  const reed = parseFloat(design.reed) || 0;
  const reedOl = Math.max(0, reed - 8);
  const grayWidthVal = parseFloat(design.gray_width) || (reedOl + 4 > 0 ? (totalEnds / (reedOl + 4)) : 0);
  const pickOl = Math.max(0, (parseFloat(design.pick_ot) || 0) - 4);
  const noD = warpRepeatSize > 0 ? Math.floor(totalEnds / warpRepeatSize) : 0;
  const repeatEnds = warpRepeatSize * noD;
  const balance = totalEnds - repeatEnds - selvage;

  // Extra ends distribution
  const extraEnds = warpRows.map(() => 0);
  let remaining = balance;
  let idx = 0;
  while (remaining > 0 && warpRows.length > 0) {
    const item = warpRows[idx % warpRows.length];
    const take = Math.min(remaining, parseInt(item.threads) || 1);
    extraEnds[idx % warpRows.length] += take;
    remaining -= take;
    idx++;
  }

  const totalMtr = parseFloat(design.total_mtr) || 0;
  const crimpPct = parseFloat(design.crimp_pct) || 0;
  const skgPct = parseFloat(design.skg_pct) || 0;
  const dyeingPct = parseFloat(design.dyeing_loss_pct) || 0;
  const warpLength = Math.round(parseFloat(design.warp_mtr) || (totalMtr * (1 + crimpPct/100) * (1 + skgPct/100)));
  const weftProMtrVal = Math.round(parseFloat(design.weft_pro_mtr) || (totalMtr * (1 + skgPct/100)));
  const wastageFactor = 1 + (crimpPct + skgPct + dyeingPct) / 100;
  const warpWastage = Math.max(1.0, wastageFactor - 0.015);



  // Aggregate Warp
  const warpColorAgg = {};
  warpRows.forEach((item, index) => {
    const cname = item.color || 'White';
    const yc = item.yarn_count || '40S CTN';
    const key = `${yc}_${cname}`;
    const itemEnds = parseInt(item.threads) || 0;
    const itemExtra = extraEnds[index] || 0;
    const itemTotalEnds = (itemEnds * noD) + itemExtra;

    if (warpColorAgg[key]) {
        warpColorAgg[key].ends += itemEnds;
      warpColorAgg[key].extra += itemExtra;
      warpColorAgg[key].total_ends += itemTotalEnds;
    } else {
      const colorCode = getColorHex(cname, colorMasters);
      warpColorAgg[key] = {
        beam_type: item.type || 'Warp',
        count: yc,
        color: cname,
        hex: colorCode,
        ends: itemEnds,
        noD: noD,
        extra: itemExtra,
        total_ends: itemTotalEnds
      };
    }
  });

  let warpSummary = [];
  try {
    warpSummary = design.warp_summary ? JSON.parse(design.warp_summary) : [];
  } catch (e) { }
  if (!Array.isArray(warpSummary) || warpSummary.length === 0) {
    warpSummary = Object.values(warpColorAgg).map(row => {
      const eqCount = parseEqCount(row.count);
      const req_kg_raw = eqCount > 0 ? (row.total_ends * 1.094 * warpLength) / (1848 * eqCount) : 0;
      const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);
      const req_kg = Math.ceil(req_kg_raw / lossFactor);
      return { ...row, req_kg };
    });
  }

  // Weft Design
  const pick = parseFloat(design.pick_ot) || 0;
  const finishWidth = parseFloat(design.finish_width) || 0;
  const weftWidth = finishWidth + selvage;
  const weftWastage = Math.max(1.0, wastageFactor - 0.085);

  const weftColorAgg = {};
  weftRows.forEach(item => {
    const cname = item.color || 'White';
    const yc = item.yarn_count || '40S CTN';
    const key = `${yc}_${cname}`;
    const itemEnds = parseInt(item.threads) || 0;

    if (weftColorAgg[key]) {
      weftColorAgg[key].ends += itemEnds;
    } else {
      const colorCode = getColorHex(cname, colorMasters);
      weftColorAgg[key] = {
        beam_type: 'Weft',
        count: yc,
        color: cname,
        hex: colorCode,
        ends: itemEnds,
        noD: 1,
        extra: 0,
        total_ends: 0
      };
    }
  });

  const totalWeftThreads = weftRows.reduce((sum, r) => sum + (parseInt(r.threads) || 0), 0);
  const reedVal = parseFloat(design.reed) || 0;
  const reedOlVal = Math.max(0, reedVal - 8);
  const totalEndsVal = parseFloat(design.total_ends) || 0;
  const reedSpaceVal = reedOlVal > 0 ? (totalEndsVal / reedOlVal) : 0;
  const pickOlVal = Math.max(0, pick - 4);
  const totalWeftEndsCalculated = Math.round(pickOlVal * (reedSpaceVal + selvage));

  let weftSummary = [];
  try {
    weftSummary = design.weft_summary ? JSON.parse(design.weft_summary) : [];
  } catch (e) { }
  if (!Array.isArray(weftSummary) || weftSummary.length === 0) {
    weftSummary = Object.values(weftColorAgg).map(row => {
      const ratio = totalWeftThreads > 0 ? row.ends / totalWeftThreads : 0;
      const groupEnds = Math.round(totalWeftEndsCalculated * ratio);
      const eqCount = parseEqCount(row.count);
      
      const req_kg_raw = eqCount > 0 ? (groupEnds * weftProMtrVal) / (1690 * eqCount) : 0;
      const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);
      const req_kg = req_kg_raw > 0 ? Math.max(1, Math.round(req_kg_raw / lossFactor)) : 0;

      return {
        ...row,
        total_ends: groupEnds,
        req_kg
      };
    });
  }

  const warpTotalEnds = warpSummary.reduce((sum, r) => sum + r.total_ends, 0);
  const warpTotalKg = warpSummary.reduce((sum, r) => sum + r.req_kg, 0);
  const weftTotalEnds = weftSummary.reduce((sum, r) => sum + r.total_ends, 0);
  const weftTotalKg = weftSummary.reduce((sum, r) => sum + r.req_kg, 0);
  const grandTotalKg = warpTotalKg + weftTotalKg;

  const warpCountLabel = yarnRows.find(y => y.type && !y.type.toLowerCase().includes('weft'))?.yarn_count || '40S CTN';
  const weftCountLabel = yarnRows.find(y => y.type && y.type.toLowerCase().includes('weft'))?.yarn_count || '40S CTN';

  // 3. Download PDF Trigger
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const payload = {
        company_name: "Dinesh Exports Private Limited",
        design_no: design.design_no,
        weave_type: design.weaving || 'Plain',
        reed: parseInt(design.reed) || 0,
        pick: parseInt(design.pick_ot) || 0,
        width: parseFloat(design.finish_width) || 0.0,
        order_length: parseFloat(design.total_mtr) || 0.0,
        warp_count: warpCountLabel,
        weft_count: weftCountLabel,
        wastage: parseFloat((wastageFactor).toFixed(3)),
        total_ends: totalEnds,
        book_no: design.book_no || '',
        page_no: design.page_no || '',
        image_path: design.image_path || null,
        
        warp_design: warpRows.map((r, i) => ({
          yarn_count: r.yarn_count || '',
          color_name: r.color,
          threads: parseInt(r.threads) || 0,
          hex: getColorHex(r.color, colorMasters),
          showTop: r.drawing_order || '-',
          rowSpan: 1,
          times: r.times || '',
          line: r.line || ''
        })),
        weft_design: weftRows.map((r, i) => ({
          yarn_count: r.yarn_count || '',
          color_name: r.color,
          threads: parseInt(r.threads) || 0,
          hex: getColorHex(r.color, colorMasters),
          times: r.times || '',
          line: r.line || ''
        })),
        warp_design_sum: warpRepeatSize,
        weft_design_sum: weftRepeatSize,
        
        noD: noD,
        repeatEnds: repeatEnds,
        balance: balance,
        selvage: selvage,
        
        warp_summary: warpSummary.map(row => ({
          beam_type: row.beam_type,
          count: row.count,
          color: row.color,
          hex: row.hex,
          ends: row.ends,
          noD: row.noD,
          extra: row.extra,
          total_ends: row.total_ends,
          req_kg: row.req_kg
        })),
        weft_summary: weftSummary.map(row => ({
          beam_type: row.beam_type,
          count: row.count,
          color: row.color,
          hex: row.hex,
          ends: row.ends,
          noD: row.noD,
          extra: row.extra,
          total_ends: row.total_ends,
          req_kg: row.req_kg
        })),
        warp_total_ends: warpTotalEnds,
        warp_total_kg: warpTotalKg,
        weft_total_ends: weftTotalEnds,
        weft_total_kg: weftTotalKg,
        grand_total_kg: grandTotalKg
      };

      const response = await textileDesignAPI.generatePdf(payload);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${design.design_no.replace(/\s+/g, '_')}_design_sheet.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('PDF generation failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 950, height: '95vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: '#4f46e5' }} /> 
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Design Sheet Preview - {design.design_no}</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleDownload} disabled={downloading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4f46e5', border: 'none', color: '#fff', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
              <Download size={14} /> {downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div style={{ padding: '40px 20px', background: '#fff', display: 'flex', justifyContent: 'center', flex: 1, overflowY: 'auto' }}>
          
          <div className="design-sheet-print" style={{ background: '#fff', width: '100%', maxWidth: 850, padding: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRadius: 4, color: '#333', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Header Box */}
            <div style={{ border: '2.5px solid #000', padding: '16px', marginBottom: 20, borderRadius: 4 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, textTransform: 'uppercase', color: '#000' }}>
                  Dinesh Exports Private Limited -Tiruchengode,Namakkal-638008
                </h2>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#444' }}>
                  DESIGN SHEET
                </h3>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, border: 'none' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 0', width: '33.33%', border: 'none', fontWeight: 700 }}>
                          D.No : <span style={{ fontWeight: 500 }}>{design.design_no}</span>
                        </td>
                        <td style={{ padding: '6px 0', width: '33.33%', border: 'none', fontWeight: 700, textAlign: 'center' }}>
                          On Loom Read : <span style={{ fontWeight: 500 }}>{design.reed_ol || design.reed}</span>
                        </td>
                        <td style={{ padding: '6px 0', width: '33.33%', border: 'none', fontWeight: 700, textAlign: 'right' }}>
                          Pick On Table : <span style={{ fontWeight: 500 }}>{design.pick_ot}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', border: 'none', fontWeight: 700 }}>
                          Weave Type : <span style={{ fontWeight: 500 }}>{design.weaving}</span>
                        </td>
                        <td style={{ padding: '6px 0', border: 'none', fontWeight: 700, textAlign: 'center' }}>
                          On Loom Width : <span style={{ fontWeight: 500 }}>{design.finish_width} inches</span>
                        </td>
                        <td style={{ padding: '6px 0', border: 'none' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {design.image_path && (
                  <div style={{ width: 120, border: '1px solid #aaa', borderRadius: 4, padding: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', flexShrink: 0, marginTop: -40 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 2 }}>Fabric Sample</span>
                    <img 
                      src={getBackendURL(design.image_path)} 
                      alt="Fabric Sample" 
                      style={{ width: '100%', height: 95, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                      onClick={() => window.open(getBackendURL(design.image_path), '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Warp Design Section */}
            <h4 style={{ margin: '0 0 8px 0', borderLeft: '3px solid #333', paddingLeft: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Warp Design</h4>
            <div style={{ overflowX: 'auto', marginBottom: 15 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #aaa' }}>
                    <th rowSpan="2" style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #ccc' }}>S.No</th>
                    <th rowSpan="2" style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #ccc' }}>Count</th>
                    <th rowSpan="2" style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #ccc' }}>Color</th>
                    <th colSpan="2" style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #ccc' }}>Threads</th>
                  </tr>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #aaa' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>Base</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>TOP</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const timesSpans = getRowSpans(warpRows, 'times');
                    return warpRows.map((row, idx) => {
                      const colorCode = getColorHex(row.color, colorMasters);
                      const isTop = row.line && row.line.toLowerCase() === 'top';
                      const baseThreads = isTop ? '-' : row.threads;
                      const spanInfo = timesSpans[idx];
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #ccc' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>{row.yarn_count}</td>
                          <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colorCode, marginRight: 6, border: '1px solid #aaa' }} />
                            {row.color}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{baseThreads}</td>
                          {spanInfo?.isStart && renderBracketCell(spanInfo.span > 1 ? row.times : (isTop ? row.threads : '-'), spanInfo.span, true)}
                        </tr>
                      );
                    });
                  })()}
                  {warpRows.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '8px', textAlign: 'center', color: '#999' }}>No Warp Design rows configured.</td>
                    </tr>
                  )}
                  <tr style={{ background: '#fff', fontWeight: 700, borderTop: '1px solid #ccc' }}>
                    <td colSpan="3" style={{ padding: '6px 10px', border: '1px solid #ccc' }}>Repeat Size</td>
                    <td colSpan="2" style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{warpRepeatSize}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Warp Calculations Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, border: '1px solid #ccc', borderRadius: 4, padding: 12, marginBottom: 20, fontSize: 11, background: '#fff' }}>
              <div><strong>Repeat size:</strong> {warpRepeatSize} X {noD} = {repeatEnds} Ends</div>
              <div><strong>Balance Ends:</strong> {balance}</div>
              <div><strong>Selvage:</strong> {selvage}</div>
              <div><strong>Total Ends:</strong> {totalEnds}</div>
            </div>

            {/* Weft Design Section */}
            <h4 style={{ margin: '0 0 8px 0', borderLeft: '3px solid #333', paddingLeft: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Weft Design</h4>
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #aaa' }}>
                    <th rowSpan="2" style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #ccc' }}>S.No</th>
                    <th rowSpan="2" style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #ccc' }}>Count</th>
                    <th rowSpan="2" style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #ccc' }}>Color</th>
                    <th colSpan="2" style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #ccc' }}>Threads</th>
                  </tr>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #aaa' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>Base</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>TOP</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const timesSpans = getRowSpans(weftRows, 'times');
                    return weftRows.map((row, idx) => {
                      const colorCode = getColorHex(row.color, colorMasters);
                      const isTop = row.line && row.line.toLowerCase() === 'top';
                      const baseThreads = isTop ? '-' : row.threads;
                      const spanInfo = timesSpans[idx];
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #ccc' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>{row.yarn_count}</td>
                          <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colorCode, marginRight: 6, border: '1px solid #aaa' }} />
                            {row.color}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{baseThreads}</td>
                          {spanInfo?.isStart && renderBracketCell(spanInfo.span > 1 ? row.times : (isTop ? row.threads : '-'), spanInfo.span, true)}
                        </tr>
                      );
                    });
                  })()}
                  {weftRows.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '8px', textAlign: 'center', color: '#999' }}>No Weft Design rows configured.</td>
                    </tr>
                  )}
                  <tr style={{ background: '#fff', fontWeight: 700, borderTop: '1px solid #ccc' }}>
                    <td colSpan="3" style={{ padding: '6px 10px', border: '1px solid #ccc' }}>Weft Repeat Size</td>
                    <td colSpan="2" style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{weftRepeatSize}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Design Requirement Summary Section */}
            <h4 style={{ margin: '0 0 8px 0', borderLeft: '3px solid #333', paddingLeft: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Design Requirement - Summary</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #aaa' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #ccc' }}>Beam Type</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #ccc' }}>Count</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #ccc' }}>Color</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>Ends</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>No D</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>Extra</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>Total End</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>Req kg</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Warp Summary Rows */}
                  {warpSummary.map((row, i) => (
                    <tr key={`warp-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>{row.beam_type}</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>{row.count}</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: row.hex, marginRight: 6, border: '1px solid #aaa' }} />
                        {row.color}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.ends}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.noD}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.extra}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.total_ends}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, border: '1px solid #ccc' }}>{row.req_kg}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#fff', fontWeight: 700 }}>
                    <td colSpan="3" style={{ padding: '6px 10px', border: '1px solid #ccc' }}>Subtotal (Warp)</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{warpRepeatSize}</td>
                    <td colSpan="2" style={{ border: '1px solid #ccc' }} />
                    <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{warpTotalEnds}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{warpTotalKg} kg</td>
                  </tr>

                  {/* Spacer */}
                  <tr style={{ height: 10, background: '#fff' }}><td colSpan="8" style={{ border: '1px solid #ccc' }} /></tr>

                  {/* Weft Summary Rows */}
                  {weftSummary.map((row, i) => (
                    <tr key={`weft-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>{row.beam_type}</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>{row.count}</td>
                      <td style={{ padding: '6px 10px', border: '1px solid #ccc' }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: row.hex, marginRight: 6, border: '1px solid #aaa' }} />
                        {row.color}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.ends}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.noD}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.extra}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{row.total_ends}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, border: '1px solid #ccc' }}>{row.req_kg}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#fff', fontWeight: 700 }}>
                    <td colSpan="3" style={{ padding: '6px 10px', border: '1px solid #ccc' }}>Subtotal (Weft)</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{weftRepeatSize}</td>
                    <td colSpan="2" style={{ border: '1px solid #ccc' }} />
                    <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{weftTotalEnds}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{weftTotalKg} kg</td>
                  </tr>

                  {/* Grand Total */}
                  <tr style={{ background: '#fff', fontWeight: 800, fontSize: 12 }}>
                    <td colSpan="7" style={{ padding: '8px 10px', border: '1px solid #ccc' }}>GRAND TOTAL REQUIREMENT</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #ccc' }}>{grandTotalKg} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 25, fontSize: 9, color: '#777', borderTop: '1px solid #ddd', paddingTop: 10, lineHeight: 1.4 }}>
              <strong>Note:</strong> Weights are calculated using standard formulas: Warp weight (kg) = (Total Ends * Length) / (Count * 840) * Wastage * 0.4536. Weft weight (kg) = (PPI * Width * Length) / (Count * 840) * Wastage * 0.4536.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function DesignEntry() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [entries, setEntries] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewModalDesign, setViewModalDesign] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchTerm, setSearchTerm] = useState('');
  const [manuallyEditedFields, setManuallyEditedFields] = useState({});

  const yarnTypeSelectRef = useRef(null);
  const fabricTypeSelectRef = useRef(null);

  const [colorMasters, setColorMasters] = useState([]);

  const [yarnCountMasters, setYarnCountMasters] = useState([]);
  const [yarnRows, setYarnRows] = useState([]);
  const [fabricDesignRows, setFabricDesignRows] = useState([]);
  const [warpSummary, setWarpSummary] = useState([]);
  const [weftSummary, setWeftSummary] = useState([]);
  const [isSummaryManuallyEdited, setIsSummaryManuallyEdited] = useState(false);
  const [newYarnRow, setNewYarnRow] = useState({
    type: 'Warp',
    yarn_count: '',
    act_count: '',
    ends: '',
    pick: '',
    crimp_pct: ''
  });
  const [isCustomYarnTypeMode, setIsCustomYarnTypeMode] = useState(false);
  const [customYarnTypeVal, setCustomYarnTypeVal] = useState('');
  const [editingYarnIdx, setEditingYarnIdx] = useState(null);
  const [editingYarnRow, setEditingYarnRow] = useState(null);
  const [editingFabricIdx, setEditingFabricIdx] = useState(null);
  const [editingFabricRow, setEditingFabricRow] = useState(null);
  const [newFabricDesignRow, setNewFabricDesignRow] = useState({
    type: '',
    yarn_count: '',
    color: '',
    threads: '',
    times: '1',
    line: '',
    pick: '',
    drawing_order: '',
    dents: '',
    line_val: '',
    ends_for_dents: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);

  const uniqueTypes = Array.from(new Set((yarnRows || []).map(r => r.type).filter(Boolean)));
  const uniqueCounts = Array.from(new Set((yarnRows || []).map(r => r.yarn_count).filter(Boolean)));

  const handleSaveCustomYarnSpecType = async () => {
    if (!customYarnTypeVal.trim()) return;
    try {
      await subMasterAPI.create('yarn_spec_type_master', {
        entity: 'yarn_spec_type_master',
        name: customYarnTypeVal.trim(),
        is_active: true
      });
      await handleRefreshOptions();
      setNewYarnRow(prev => ({ ...prev, type: customYarnTypeVal.trim() }));
      setIsCustomYarnTypeMode(false);
      setCustomYarnTypeVal('');
    } catch (err) {
      console.error('Error saving yarn spec type:', err);
      alert('Error saving custom yarn spec type');
    }
  };

  const startEditYarnRow = (idx) => {
    setEditingYarnIdx(idx);
    setEditingYarnRow({ ...yarnRows[idx] });
  };

  const saveEditYarnRow = (idx) => {
    const updated = [...yarnRows];
    updated[idx] = editingYarnRow;
    setYarnRows(updated);
    setEditingYarnIdx(null);
    setEditingYarnRow(null);
  };

  const startEditFabricRow = (idx) => {
    setEditingFabricIdx(idx);
    setEditingFabricRow({ ...fabricDesignRows[idx] });
  };

  const saveEditFabricRow = (idx) => {
    const updated = [...fabricDesignRows];
    const oldRow = fabricDesignRows[idx];
    const newRow = editingFabricRow;
    updated[idx] = newRow;

    const timesSpans = getRowSpans(fabricDesignRows, 'times');
    const tSpan = timesSpans[idx];
    if (tSpan?.isStart && oldRow.times !== newRow.times) {
      for (let k = 1; k < tSpan.span; k++) {
        updated[idx + k] = { ...updated[idx + k], times: newRow.times };
      }
    }

    const drawingSpans = getRowSpans(fabricDesignRows, 'drawing_order');
    const dSpan = drawingSpans[idx];
    if (dSpan?.isStart && oldRow.drawing_order !== newRow.drawing_order) {
      for (let k = 1; k < dSpan.span; k++) {
        updated[idx + k] = { ...updated[idx + k], drawing_order: newRow.drawing_order };
      }
    }

    setFabricDesignRows(updated);
    setEditingFabricIdx(null);
    setEditingFabricRow(null);
  };

  const addYarnRow = () => {
    if (!newYarnRow.yarn_count) {
      alert("Please select a yarn count.");
      return;
    }
    setYarnRows(prev => [...prev, { ...newYarnRow, id: Date.now() }]);
    setNewYarnRow({
      type: 'Warp',
      yarn_count: '',
      act_count: '',
      ends: '',
      pick: '',
      crimp_pct: ''
    });
    setTimeout(() => {
      yarnTypeSelectRef.current?.focus();
    }, 50);
  };

  const deleteYarnRow = (idx) => {
    setYarnRows(yarnRows.filter((_, i) => i !== idx));
  };

  const addFabricDesignRow = () => {
    if (!newFabricDesignRow.yarn_count) {
      alert("Please select a yarn count.");
      return;
    }
    setFabricDesignRows(prev => [...prev, { ...newFabricDesignRow, id: Date.now() }]);
    setNewFabricDesignRow({
      type: '',
      yarn_count: '',
      color: '',
      threads: '',
      times: '1',
      line: '',
      pick: '',
      drawing_order: '',
      dents: '',
      line_val: '',
      ends_for_dents: ''
    });
    setTimeout(() => {
      fabricTypeSelectRef.current?.focus();
    }, 50);
  };


  const deleteFabricDesignRow = (idx) => {
    setFabricDesignRows(fabricDesignRows.filter((_, i) => i !== idx));
  };

  const handleWarpSummaryChange = (index, field, value) => {
    setIsSummaryManuallyEdited(true);
    const updated = [...warpSummary];
    const parsedVal = value === '' ? '' : (field === 'req_kg' ? (parseFloat(value) || 0) : (parseInt(value) || 0));
    updated[index] = { ...updated[index], [field]: parsedVal };
    
    if (field === 'ends' || field === 'noD' || field === 'extra') {
      const ends = parseInt(field === 'ends' ? value : updated[index].ends) || 0;
      const noD = parseInt(field === 'noD' ? value : updated[index].noD) || 0;
      const extra = parseInt(field === 'extra' ? value : updated[index].extra) || 0;
      updated[index].total_ends = ends * noD + extra;
    }

    if (field !== 'req_kg') {
      const eqCount = updated[index].actCount || parseEqCount(updated[index].count);
      const totalMtr = parseFloat(form.total_mtr) || 0;
      const crimpPct = parseFloat(form.crimp_pct) || 0;
      const skgPct = parseFloat(form.skg_pct) || 0;
      const dyeingPct = parseFloat(form.dyeing_loss_pct) || 0;
      const warpLength = Math.round(parseFloat(form.warp_mtr) || (totalMtr * (1 + crimpPct/100) * (1 + skgPct/100)));
      const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);

      const req_kg_raw = eqCount > 0 ? ((parseInt(updated[index].total_ends) || 0) * 1.094 * warpLength) / (1848 * eqCount) : 0;
      updated[index].req_kg = Math.round(req_kg_raw / lossFactor);
    }

    setWarpSummary(updated);
  };

  const handleWeftSummaryChange = (index, field, value) => {
    setIsSummaryManuallyEdited(true);
    const updated = [...weftSummary];
    const parsedVal = value === '' ? '' : (field === 'req_kg' ? (parseFloat(value) || 0) : (parseInt(value) || 0));
    updated[index] = { ...updated[index], [field]: parsedVal };

    if (field !== 'req_kg') {
      const eqCount = updated[index].actCount || parseEqCount(updated[index].count);
      const totalMtr = parseFloat(form.total_mtr) || 0;
      const skgPct = parseFloat(form.skg_pct) || 0;
      const dyeingPct = parseFloat(form.dyeing_loss_pct) || 0;
      const weftProMtrVal = Math.round(parseFloat(form.weft_pro_mtr) || (totalMtr * (1 + skgPct/100)));
      const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);

      const req_kg_raw = eqCount > 0 ? ((parseInt(updated[index].total_ends) || 0) * weftProMtrVal) / (1690 * eqCount) : 0;
      updated[index].req_kg = req_kg_raw > 0 ? Math.max(1, Math.round(req_kg_raw / lossFactor)) : 0;
    }

    setWeftSummary(updated);
  };

  // Filters
  const [fabricFilter, setFabricFilter] = useState('All Fabrics');
  const [weavingFilter, setWeavingFilter] = useState('All Weaves');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    ds_date: new Date().toISOString().split('T')[0],
    design_no: '', color: '', created_by: '', gry_const: '', count_rxpxw: '',
    buyer_name: '', ibpo_no: '', order_mtr: 0, ex_mtr: 0, total_mtr: 0,
    crimp_pct: 0, skg_pct: 0, warp_mtr: 0, weft_pro_mtr: 0, gray_width: 0,
    finish_width: 0, reed_ol: 0, pick_ot: 0, reed: 0, fabric: 'Cotton',
    total_ends: 0, warp_width: 0, qlm: 0, toie_pct: 0, selvage_waste: 0,
    weaving: 'Plain', design_type: 'Normal', packing_less: 0, weight_grm: 0, dyeing_loss_pct: 0,
    book_no: '', page_no: '', ibpo_image: ''
  };

  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState({ masters: {}, masters_with_ids: {} });

  const handleRefreshOptions = async () => {
    try {
      const { data } = await dropdownAPI.getAll();
      setOptions(data);
    } catch (err) {
      console.error('Error refreshing dropdowns:', err);
    }
  };

  const loadData = async () => {
    try {
      const [entriesRes, partiesRes, empRes, ordRes, colorRes, countRes, dropRes] = await Promise.all([
        designEntryAPI.list(),
        partyAPI.list(),
        employeeAPI.list(),
        buyerOrderAPI.list(),
        subMasterAPI.list('color_master').catch(() => ({ data: [] })),
        subMasterAPI.list('yarn_count_master').catch(() => ({ data: [] })),
        dropdownAPI.getAll().catch(() => ({ data: { masters: {}, masters_with_ids: {} } }))
      ]);
      setEntries(entriesRes.data);
      setBuyers(partiesRes.data.filter(p => p.party_type === 'Sales Party' || p.party_type === 'Sales' || p.party_type === 'Customer' || p.party_type === 'Buyer' || (p.party_type || '').toLowerCase().includes('buyer')));
      setEmployees(empRes.data);
      setOrders(ordRes.data);
      setColorMasters(colorRes.data || []);
      setYarnCountMasters(countRes.data || []);
      setOptions(dropRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (queryId && entries.length > 0) {
      const matched = entries.find(e => String(e.id) === String(queryId));
      if (matched) {
        handleOpenForm(matched, true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [queryId, entries]);

  useEffect(() => {
    if (isSummaryManuallyEdited) return;

    const warpRows = fabricDesignRows.filter(r => r.type && !r.type.toLowerCase().includes('weft'));
    const weftRows = fabricDesignRows.filter(r => r.type && r.type.toLowerCase().includes('weft'));

    const warpRepeatSize = calculateRepeatSize(warpRows);
    const weftRepeatSize = calculateRepeatSize(weftRows);

    const totalEnds = parseFloat(form.total_ends) || 0;
    const selvage = parseFloat(form.selvage_waste) || 0;
    const reed = parseFloat(form.reed) || 0;
    const reedOl = Math.max(0, reed - 8);
    const grayWidthVal = parseFloat(form.gray_width) || (reedOl + 4 > 0 ? (totalEnds / (reedOl + 4)) : 0);
    const pickOl = Math.max(0, (parseFloat(form.pick_ot) || 0) - 4);
    const calculatedNoD = (warpRepeatSize > 0 && totalEnds > 0) ? Math.floor(totalEnds / warpRepeatSize) : 0;
    const repeatEnds = warpRepeatSize * calculatedNoD;
    const balance = totalEnds - repeatEnds - selvage;

    const extraEnds = warpRows.map(() => 0);
    let remaining = balance;
    let idx = 0;
    while (remaining > 0 && warpRows.length > 0) {
      const item = warpRows[idx % warpRows.length];
      const take = Math.min(remaining, parseInt(item.threads) || 1);
      extraEnds[idx % warpRows.length] += take;
      remaining -= take;
      idx++;
    }

    const totalMtr = parseFloat(form.total_mtr) || 0;
    const crimpPct = parseFloat(form.crimp_pct) || 0;
    const skgPct = parseFloat(form.skg_pct) || 0;
    const dyeingPct = parseFloat(form.dyeing_loss_pct) || 0;
    const warpLength = Math.round(parseFloat(form.warp_mtr) || (totalMtr * (1 + crimpPct/100) * (1 + skgPct/100)));
    const weftProMtrVal = Math.round(parseFloat(form.weft_pro_mtr) || (totalMtr * (1 + skgPct/100)));

    // Aggregate Warp
    const warpColorAgg = {};
    warpRows.forEach((item, index) => {
      const cname = item.color || 'White';
      const itemType = item.type || 'Warp beam1';
      
      // Match yarn spec from yarnRows for this beam type
      const matchingSpec = (yarnRows || []).find(y => 
        y.type && (y.type.trim().toLowerCase() === itemType.trim().toLowerCase() || (!y.type.toLowerCase().includes('weft') && !itemType.toLowerCase().includes('weft')))
      );

      const yc = (item.yarn_count && item.yarn_count !== '40S CTN') ? item.yarn_count : (matchingSpec?.yarn_count || item.yarn_count || '20S CTN');
      const actCount = (matchingSpec && matchingSpec.act_count && parseFloat(matchingSpec.act_count) > 0)
        ? parseFloat(matchingSpec.act_count)
        : parseEqCount(yc);

      const rowTimes = parseInt(item.times) || 0;
      const rowNoD = rowTimes > 0 ? rowTimes : (calculatedNoD > 0 ? calculatedNoD : 1);

      const beamLabel = item.type || matchingSpec?.type || 'Warp beam1';
      const key = `${beamLabel}_${yc}_${cname}`;
      const itemEnds = parseInt(item.threads) || 0;
      const itemExtra = extraEnds[index] || 0;
      const itemTotalEnds = (itemEnds * rowNoD) + itemExtra;

      if (warpColorAgg[key]) {
        warpColorAgg[key].ends += itemEnds;
        warpColorAgg[key].extra += itemExtra;
        warpColorAgg[key].total_ends += itemTotalEnds;
      } else {
        const colorCode = getColorHex(cname, colorMasters);
        warpColorAgg[key] = {
          beam_type: beamLabel,
          count: yc,
          actCount: actCount,
          color: cname,
          hex: colorCode,
          ends: itemEnds,
          noD: rowNoD,
          extra: itemExtra,
          total_ends: itemTotalEnds
        };
      }
    });

    const computedWarpSummary = Object.values(warpColorAgg).map(row => {
      const eqCount = row.actCount || parseEqCount(row.count);
      // REQ KGS = Ends x 1.094 / 1848 / Warp Count x Warp Mtr (or Ends x Warp Mtr / (1690 * Count))
      const req_kg_raw = eqCount > 0 ? (row.total_ends * 1.094 * warpLength) / (1848 * eqCount) : 0;
      const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);
      const req_kg = Math.round(req_kg_raw / lossFactor);
      return { ...row, req_kg };
    });

    // Aggregate Weft
    const weftColorAgg = {};
    weftRows.forEach(item => {
      const cname = item.color || 'White';
      const matchingSpec = (yarnRows || []).find(y => y.type && y.type.toLowerCase().includes('weft'));
      const yc = (item.yarn_count && item.yarn_count !== '40S CTN') ? item.yarn_count : (matchingSpec?.yarn_count || item.yarn_count || '20S CTN');
      const actCount = (matchingSpec && matchingSpec.act_count && parseFloat(matchingSpec.act_count) > 0)
        ? parseFloat(matchingSpec.act_count)
        : parseEqCount(yc);

      const key = `${yc}_${cname}`;
      const itemEnds = parseInt(item.threads) || 0;

      if (weftColorAgg[key]) {
        weftColorAgg[key].ends += itemEnds;
      } else {
        const colorCode = getColorHex(cname, colorMasters);
        weftColorAgg[key] = {
          beam_type: 'Weft',
          count: yc,
          actCount: actCount,
          color: cname,
          hex: colorCode,
          ends: itemEnds,
          noD: 1,
          extra: 0,
          total_ends: 0
        };
      }
    });

    const totalWeftThreads = weftRows.reduce((sum, r) => sum + (parseInt(r.threads) || 0), 0);
    const reedSpaceVal = reedOl > 0 ? (totalEnds / reedOl) : 0;
    const totalWeftEndsCalculated = Math.round(pickOl * (reedSpaceVal + selvage));

    const computedWeftSummary = Object.values(weftColorAgg).map(row => {
      const ratio = totalWeftThreads > 0 ? row.ends / totalWeftThreads : 0;
      const groupEnds = Math.round(totalWeftEndsCalculated * ratio);
      const eqCount = row.actCount || parseEqCount(row.count);
      
      const req_kg_raw = eqCount > 0 ? (groupEnds * weftProMtrVal) / (1690 * eqCount) : 0;
      const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);
      const req_kg = req_kg_raw > 0 ? Math.max(1, Math.round(req_kg_raw / lossFactor)) : 0;

      return {
        ...row,
        total_ends: groupEnds,
        req_kg
      };
    });

    setWarpSummary(computedWarpSummary);
    setWeftSummary(computedWeftSummary);
  }, [
    isSummaryManuallyEdited,
    fabricDesignRows,
    form.total_ends,
    form.selvage_waste,
    form.reed,
    form.gray_width,
    form.pick_ot,
    form.total_mtr,
    form.crimp_pct,
    form.skg_pct,
    form.dyeing_loss_pct,
    form.warp_mtr,
    form.weft_pro_mtr,
    colorMasters
  ]);

  const recalculateForm = (currentForm, currentYarnRows) => {
    const orderMtr = parseFloat(currentForm.order_mtr) || 0;
    const exMtr = parseFloat(currentForm.ex_mtr) || 0;
    const totalMtr = orderMtr + exMtr;

    const crimpPct = parseFloat(currentForm.crimp_pct) || 0;
    const skgPct = parseFloat(currentForm.skg_pct) || 0;

    const weftProMtr = Math.round(totalMtr * (1 + skgPct / 100));
    const warpMtr = Math.round(weftProMtr * (1 + crimpPct / 100));

    const reed = parseFloat(currentForm.reed) || 0;
    const reedOl = Math.max(0, reed - 8);

    const finishWidth = parseFloat(currentForm.finish_width) || 0;
    const totalEnds = Math.round(reed * finishWidth);

    const warpWidth = reedOl > 0 ? parseFloat((totalEnds / reedOl).toFixed(2)) : 0;
    const grayWidth = (reedOl + 4) > 0 ? parseFloat((totalEnds / (reedOl + 4)).toFixed(2)) : 0;

    const warpRow = (currentYarnRows || []).find(y => y.type && !y.type.toLowerCase().includes('weft'));
    const weftRow = (currentYarnRows || []).find(y => y.type && y.type.toLowerCase().includes('weft'));
    
    const warpCount = warpRow ? (parseFloat(warpRow.act_count) || parseEqCount(warpRow.yarn_count)) : 40.0;
    const weftCount = weftRow ? (parseFloat(weftRow.act_count) || parseEqCount(weftRow.yarn_count)) : 20.0;

    const gsm = (warpCount > 0 && weftCount > 0)
      ? parseFloat((((reed / warpCount) + (parseFloat(currentForm.pick_ot) || 0) / weftCount) * 25.4).toFixed(2))
      : 0;

    const glm = parseFloat((gsm * (finishWidth / 39.37)).toFixed(2));

    return {
      ...currentForm,
      total_mtr: totalMtr,
      weft_pro_mtr: weftProMtr,
      warp_mtr: warpMtr,
      reed_ol: reedOl,
      total_ends: totalEnds,
      warp_width: warpWidth,
      gray_width: grayWidth,
      weight_grm: gsm,
      qlm: glm
    };
  };

  useEffect(() => {
    setForm(prev => {
      const recalculated = recalculateForm(prev, yarnRows);
      const updated = { ...prev };
      let changed = false;

      const calcFields = [
        'total_mtr',
        'weft_pro_mtr',
        'warp_mtr',
        'reed_ol',
        'total_ends',
        'warp_width',
        'gray_width',
        'weight_grm',
        'qlm'
      ];

      calcFields.forEach(field => {
        if (!manuallyEditedFields[field] && recalculated[field] !== prev[field]) {
          updated[field] = recalculated[field];
          changed = true;
        }
      });

      if (changed) {
        return updated;
      }
      return prev;
    });
  }, [
    form.order_mtr,
    form.ex_mtr,
    form.crimp_pct,
    form.skg_pct,
    form.reed,
    form.finish_width,
    form.pick_ot,
    yarnRows,
    manuallyEditedFields
  ]);

  const handleUploadImageOnly = async () => {
    let fileToUpload = selectedFile;
    if (selectedFiles && selectedFiles.length >= 2) {
      fileToUpload = selectedFiles[1];
    }
    if (!fileToUpload) {
      alert("Please choose a file first");
      return;
    }
    if (!editingId) {
      alert("Please save the design entry first before uploading an image directly, or the image will be uploaded automatically when you click Save Design.");
      return;
    }
    try {
      const res = await designEntryAPI.uploadImage(editingId, fileToUpload);
      alert("Image uploaded successfully!");
      setImagePreviewUrl(res.data.image_path);
      loadData();
    } catch (err) {
      alert("Failed to upload image.");
      console.error(err);
    }
  };

  const handleExtractDesign = async (filesToExtract) => {
    const targetFiles = filesToExtract || selectedFiles;
    if (!targetFiles || targetFiles.length === 0) {
      alert("Please choose one or more images first");
      return;
    }
    setIsExtracting(true);
    try {
      const res = await designEntryAPI.extractDesign(targetFiles);
      const repeatCount = res.data.no_of_repeats || 1;
      const extractedRows = res.data.rows.map((row, idx) => {
        const isWeft = row.type && row.type.trim().toLowerCase() === 'weft';
        const matchingSpec = (yarnRows || []).find(y => {
          if (!y.type) return false;
          const yTypeLower = y.type.trim().toLowerCase();
          if (isWeft) {
            return yTypeLower.includes('weft');
          } else {
            return !yTypeLower.includes('weft');
          }
        });
        
        const userSpecCount = matchingSpec && matchingSpec.yarn_count && matchingSpec.yarn_count.trim();
        const aiExtractedCount = row.yarn_count && row.yarn_count.trim();
        const finalCount = userSpecCount || aiExtractedCount || '20S CTN';

        const defaultTimes = isWeft ? "1" : String(repeatCount);

        return {
          ...row,
          type: matchingSpec ? matchingSpec.type : row.type,
          yarn_count: finalCount,
          times: String(row.times || defaultTimes),
          id: Date.now() + idx
        };
      });

      if (res.data.design_no) {
        setForm(prev => ({
          ...prev,
          design_no: prev.design_no || res.data.design_no
        }));
      }

      setFabricDesignRows(extractedRows);
      
      const warpCount = extractedRows.filter(r => (r.type || '').toLowerCase().includes('warp')).length;
      const weftCount = extractedRows.filter(r => (r.type || '').toLowerCase().includes('weft')).length;
      
      alert(`Successfully extracted ${extractedRows.length} design lines from image(s)!\n• Warp lines: ${warpCount}\n• Weft lines: ${weftCount}\n• No D (Repeats): ${repeatCount}`);
    } catch (err) {
      console.error("AI Extraction Error:", err);
      const backendMsg = err.response?.data?.detail;
      alert(backendMsg ? `AI Extraction Error:\n\n${backendMsg}` : "Failed to extract design from image(s). Please check backend logs or network connection.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        yarn_details: JSON.stringify(yarnRows),
        fabric_design_details: JSON.stringify(fabricDesignRows),
        warp_summary: JSON.stringify(warpSummary),
        weft_summary: JSON.stringify(weftSummary)
      };
      let savedEntry = null;
      if (editingId) {
        const res = await designEntryAPI.update(editingId, payload);
        savedEntry = res.data;
      } else {
        const res = await designEntryAPI.create(payload);
        savedEntry = res.data;
      }

      let fileToUpload = selectedFile;
      if (selectedFiles && selectedFiles.length >= 2) {
        fileToUpload = selectedFiles[1];
      }
      if (fileToUpload && savedEntry && savedEntry.id) {
        await designEntryAPI.uploadImage(savedEntry.id, fileToUpload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      setManuallyEditedFields({});
      setSelectedFile(null);
      setSelectedFiles([]);
      setImagePreviewUrl(null);
      setYarnRows([]);
      setFabricDesignRows([]);
      setWarpSummary([]);
      setWeftSummary([]);
      setIsSummaryManuallyEdited(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving design entry');
      console.error(err);
    }
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await designEntryAPI.get(entry.id);
      if (data.ds_date) data.ds_date = data.ds_date.substring(0, 10);

      let yDetails = [];
      let fdDetails = [];
      try {
        if (data.yarn_details) yDetails = JSON.parse(data.yarn_details);
      } catch (e) { }
      try {
        if (data.fabric_design_details) fdDetails = JSON.parse(data.fabric_design_details);
      } catch (e) { }

      let wSummary = [];
      let wfSummary = [];
      try {
        if (data.warp_summary) wSummary = JSON.parse(data.warp_summary);
      } catch (e) { }
      try {
        if (data.weft_summary) wfSummary = JSON.parse(data.weft_summary);
      } catch (e) { }

      setYarnRows(yDetails);
      setFabricDesignRows(fdDetails);
      setWarpSummary(wSummary);
      setWeftSummary(wfSummary);
      setIsSummaryManuallyEdited(wSummary.length > 0 || wfSummary.length > 0);
      setImagePreviewUrl(data.image_path || null);
      setSelectedFile(null);
      setSelectedFiles([]);

      const matchedOrder = orders.find(o => o.ibpo_number === data.ibpo_no);
      const ibpoImg = matchedOrder?.items?.[0]?.image_design_path || '';

      setManuallyEditedFields({
        total_mtr: true,
        weft_pro_mtr: true,
        warp_mtr: true,
        reed_ol: true,
        total_ends: true,
        warp_width: true,
        gray_width: true,
        weight_grm: true,
        qlm: true
      });

      setForm({ ...initialForm, ...data, ibpo_image: ibpoImg });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('basic');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading details.");
    }
  };

  const handleApprove = async (id, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Approve Design Entry',
      message: 'Are you sure you want to approve this design? This will notify the Purchase Team.',
      type: 'approve',
      confirmText: 'Approve'
    });
    if (confirmed) {
      try {
        await designEntryAPI.approve(id);
        alert('Design approved successfully!');
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error approving design');
        console.error(err);
      }
    }
  };

  const handleDelete = async (id, ds_ref, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Delete Design Entry',
      message: `Are you sure you want to delete ${ds_ref}?`,
      type: 'delete',
      confirmText: 'Delete'
    });
    if (confirmed) {
      try {
        await designEntryAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
        console.error(err);
      }
    }
  };


  const handleRowClick = async (entry) => {
    try {
      const { data } = await designEntryAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;

    if (name === 'ibpo_no') {
      if (!value) {
        setForm(prev => ({
          ...prev,
          ibpo_no: '',
          buyer_name: '',
          design_no: '',
          color: '',
          gry_const: '',
          fabric: 'Cotton',
          weaving: 'Plain',
          pick_ot: 0,
          finish_width: 0,
          order_mtr: 0,
          ex_mtr: 0,
          total_mtr: 0,
          reed: 0,
          ibpo_image: ''
        }));
        return;
      }
      const selectedOrder = orders.find(o => o.ibpo_number === value);
      if (selectedOrder) {
        const firstItem = selectedOrder.items?.[0] || {};
        const ordMtr = firstItem.order_mtrs || 0;
        const exMtr = 0;
        
        const digitsMatch = value.match(/\d+/);
        const suffix = digitsMatch ? digitsMatch[0] : '';
        
        setForm(prev => {
          const autoDesignNo = firstItem.design_no || (suffix ? `DEPL-${suffix}` : prev.design_no);
          return {
            ...prev,
            ibpo_no: value,
            buyer_name: selectedOrder.party_name || selectedOrder.buyer_name || prev.buyer_name,
            design_no: autoDesignNo,
            color: firstItem.color || prev.color,
            gry_const: firstItem.gry_construction || prev.gry_const,
            fabric: firstItem.fabric_type || prev.fabric,
            weaving: firstItem.weaving_type || prev.weaving,
            pick_ot: firstItem.pick_on_table || prev.pick_ot,
            finish_width: firstItem.finish_width || prev.finish_width,
            order_mtr: ordMtr,
            ex_mtr: exMtr,
            total_mtr: ordMtr + exMtr,
            reed: firstItem.finish_reed || prev.reed,
            count_rxpxw: firstItem.construction || prev.count_rxpxw,
            toie_pct: firstItem.tolerance_pct || prev.toie_pct,
            weight_grm: firstItem.gsm || prev.weight_grm,
            ibpo_image: firstItem.image_design_path || ''
          };
        });
        return;
      }
    }

    if (['total_mtr', 'weft_pro_mtr', 'warp_mtr', 'reed_ol', 'total_ends', 'warp_width', 'gray_width', 'weight_grm', 'qlm'].includes(name)) {
      setManuallyEditedFields(prev => ({ ...prev, [name]: true }));
    }

    if (name === 'order_mtr') {
      setForm(prev => ({
        ...prev,
        order_mtr: value,
        total_mtr: value + prev.ex_mtr
      }));
      return;
    }
    if (name === 'ex_mtr') {
      setForm(prev => ({
        ...prev,
        ex_mtr: value,
        total_mtr: prev.order_mtr + value
      }));
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setActiveTab(nextTab);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 100);
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = searchTerm === '' ||
      e.ds_ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.design_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFabric = fabricFilter === 'All Fabrics' || (e.fabric || 'Cotton') === fabricFilter;
    const matchesWeaving = weavingFilter === 'All Weaves' || (e.weaving || 'Plain') === weavingFilter;
    const matchesType = typeFilter === 'All Types' || (e.design_type || 'Normal') === typeFilter;

    let matchesDate = true;
    if (e.ds_date) {
      const entryDate = new Date(e.ds_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesFabric && matchesWeaving && matchesType && matchesDate;
  });

  const totalDesigns = entries.length;
  const cottonDesigns = entries.filter(e => e.fabric === 'Cotton').length;
  const polyesterDesigns = entries.filter(e => e.fabric === 'Polyester').length;
  const specialDesigns = entries.filter(e => e.design_type === 'Special').length;

  const handleCardClick = (type) => {
    setFabricFilter('All Fabrics');
    setWeavingFilter('All Weaves');
    setTypeFilter('All Types');
    if (type === 'Cotton') setFabricFilter('Cotton');
    if (type === 'Polyester') setFabricFilter('Polyester');
    if (type === 'Special') setTypeFilter('Special');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Design Entry Report", 14, 15);
    const headers = [["DS Ref No", "Date", "Design No", "Buyer", "Fabric", "Weaving", "Book No", "Page No"]];
    const rows = filteredEntries.map(e => [
      e.ds_ref_no || '-',
      e.ds_date || '-',
      e.design_no || '-',
      e.buyer_name || '-',
      e.fabric || '-',
      e.weaving || '-',
      e.book_no || '-',
      e.page_no || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Design_Entries_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredEntries.map(e => ({
      "DS Ref No": e.ds_ref_no,
      "DS Date": e.ds_date,
      "Design No": e.design_no,
      "Buyer": e.buyer_name,
      "Fabric": e.fabric,
      "Weaving": e.weaving,
      "Design Type": e.design_type,
      "Book No": e.book_no,
      "Page No": e.page_no,
      "Created By": e.created_by
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Design Entries");
    XLSX.writeFile(wb, `Design_Entries_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const warpSubtotalEnds = warpSummary.reduce((sum, r) => sum + (parseInt(r.ends) || 0), 0);
  const warpSubtotalExtra = warpSummary.reduce((sum, r) => sum + (parseInt(r.extra) || 0), 0);
  const warpSubtotalTotalEnds = warpSummary.reduce((sum, r) => sum + (parseInt(r.total_ends) || 0), 0);
  const warpSubtotalKg = warpSummary.reduce((sum, r) => sum + (parseFloat(r.req_kg) || 0), 0);

  const weftSubtotalEnds = weftSummary.reduce((sum, r) => sum + (parseInt(r.ends) || 0), 0);
  const weftSubtotalTotalEnds = weftSummary.reduce((sum, r) => sum + (parseInt(r.total_ends) || 0), 0);
  const weftSubtotalKg = weftSummary.reduce((sum, r) => sum + (parseFloat(r.req_kg) || 0), 0);

  const grandTotalKg = warpSubtotalKg + weftSubtotalKg;

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={24} color="var(--primary)" /> Design Entry
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage design specifications and weaving details.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={16} /> Export <ChevronDown size={14} />
                </button>

                {showExportMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden' }}>
                    <button
                      onClick={() => { exportPDF(); setShowExportMenu(false); }}
                      style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <FileText size={16} color="#ef4444" /> PDF Report
                    </button>
                    <button
                      onClick={() => { exportExcel(); setShowExportMenu(false); }}
                      style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Download size={16} color="#10b981" /> Excel Sheet
                    </button>
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setManuallyEditedFields({}); setIsReadOnly(false); setActiveTab('basic'); setShowForm(true); setYarnRows([]); setFabricDesignRows([]); setSelectedFile(null); setSelectedFiles([]); setImagePreviewUrl(null); }}>
                <Plus size={16} /> New Design
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Palette size={24} /></div>
              <div className="stat-details"><h3>Total Designs</h3><div className="value">{totalDesigns}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Cotton')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Cotton Fabric</h3><div className="value">{cottonDesigns}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Polyester')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Layers size={24} /></div>
              <div className="stat-details"><h3>Polyester Fabric</h3><div className="value">{polyesterDesigns}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Special')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><CheckSquare size={24} /></div>
              <div className="stat-details"><h3>Special Designs</h3><div className="value">{specialDesigns}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search by DS Ref or Design No..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span></div>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={fabricFilter} onChange={e => setFabricFilter(e.target.value)}>
                <option>All Fabrics</option><option>Cotton</option><option>Polyester</option><option>Blended</option><option>Silk</option>
              </select>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={weavingFilter} onChange={e => setWeavingFilter(e.target.value)}>
                <option>All Weaves</option><option>Plain</option><option>Twill</option><option>Satin</option><option>Jacquard</option>
              </select>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Normal</option><option>Special</option><option>Sample</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Design EntryNo</th><th>DS Date</th><th>Design No</th><th>Buyer</th><th>Fabric</th><th>Weaving</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredEntries.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No designs found.</td></tr>
                    ) : filteredEntries.map(e => (
                      <tr key={e.id} onClick={() => handleRowClick(e)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === e.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.ds_ref_no}</td>
                        <td>{e.ds_date}</td>
                        <td style={{ fontWeight: 500 }}>{e.design_no}</td>
                        <td>{e.buyer_name || '-'}</td>
                        <td><span className="badge badge-draft">{e.fabric || 'N/A'}</span></td>
                        <td><span className="badge badge-active">{e.weaving || 'N/A'}</span></td>
                        <td>
                          <span className={`badge ${e.status === 'Approved' ? 'badge-active' : 'badge-draft'}`} style={e.status === 'Approved' ? { background: '#10b981', color: 'white' } : {}}>
                            {e.status || 'Pending'}
                          </span>
                        </td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {e.status !== 'Approved' && (
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: '#10b981' }} onClick={(evt) => handleApprove(e.id, evt)} title="Approve Design">
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => { evt.stopPropagation(); setViewModalDesign(e); }} title="Preview Design"><Eye size={14} color="var(--primary)" /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(e, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(e.id, e.ds_ref_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedViewEntry && (
              <div style={{ flex: '0 0 350px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                      <Palette size={18} /> {selectedViewEntry.ds_ref_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setViewModalDesign(selectedViewEntry)} title="Preview Design"><Eye size={14} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Design No" value={selectedViewEntry.design_no} />
                    <DetailRow label="DS Date" value={selectedViewEntry.ds_date} />
                    <DetailRow label="Buyer" value={selectedViewEntry.buyer_name} />
                    <DetailRow label="IBPO No" value={selectedViewEntry.ibpo_no} />
                    <DetailRow label="Book No" value={selectedViewEntry.book_no} />
                    <DetailRow label="Page No" value={selectedViewEntry.page_no} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specifications</h4>
                    <DetailRow label="Gry Const" value={selectedViewEntry.gry_const} />
                    <DetailRow label="Fabric" value={selectedViewEntry.fabric} />
                    <DetailRow label="Weaving" value={selectedViewEntry.weaving} />
                    <DetailRow label="Design Type" value={selectedViewEntry.design_type} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Measurements</h4>
                    <DetailRow label="Total Mtr" value={selectedViewEntry.total_mtr} />
                    <DetailRow label="Finish Width" value={selectedViewEntry.finish_width} />
                    <DetailRow label="Weight (g)" value={selectedViewEntry.weight_grm} />
                    {selectedViewEntry.image_path && (
                      <div style={{ marginTop: 12 }}>
                        <h4 style={{ margin: '8px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Design Image</h4>
                        <img
                          src={getBackendURL(selectedViewEntry.image_path)}
                          alt="Design Preview"
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)', marginTop: 4, cursor: 'pointer' }}
                          onClick={() => window.open(getBackendURL(selectedViewEntry.image_path), '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0, minWidth: 0, maxWidth: '100%' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-primary)', padding: 4, borderRadius: '50%', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Design Details' : editingId ? 'Edit Design Entry' : 'New Design Entry'}</h2>
            </div>
          </div>

          {/* No Tabs - show all fields together style */}
          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              <form id="designForm" onSubmit={handleCreate}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
                  <style>
                    {`
                      #designForm > div > div {
                        min-width: 0;
                        max-width: 100%;
                      }
                      .data-table-wrapper {
                        overflow-x: auto;
                        width: 100%;
                      }
                    `}
                  </style>
                  {/* Top section: Basic & Buyer Info */}
                  <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Basic & Buyer Info</h4>
                    
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Left Side: Form Details */}
                      <div style={{ flex: '1 1 min(100%, 600px)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                          <div className="form-group"><label>DS Date *</label><input type="date" className="form-control" name="ds_date" value={form.ds_date} onChange={handleChange} required /></div>
                          <div className="form-group"><label>Design No *</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} required /></div>
                          <div className="form-group"><label>Color</label><input className="form-control" name="color" value={form.color} onChange={handleChange} /></div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 16 }}>
                          <div className="form-group"><label>Count RxPXW</label><input className="form-control" name="count_rxpxw" value={form.count_rxpxw} onChange={handleChange} /></div>
                          <div className="form-group"><label>Created By</label>
                            <select className="form-control" name="created_by" value={form.created_by} onChange={handleChange}>
                              <option value="">Select Employee...</option>
                              {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                            </select>
                          </div>
                          <div className="form-group"><label>Gry Const</label><input className="form-control" name="gry_const" value={form.gry_const} onChange={handleChange} /></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
                          <div className="form-group"><label>Buyer Name</label>
                            <select className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange}>
                              <option value="">Select Buyer...</option>
                              {buyers.map(b => <option key={b.id} value={b.company_name}>{b.company_name}</option>)}
                              {form.buyer_name && !buyers.some(b => b.company_name === form.buyer_name) && (
                                <option value={form.buyer_name}>{form.buyer_name}</option>
                              )}
                            </select>
                          </div>
                          <div className="form-group"><label>IBPO No</label>
                            <select className="form-control" name="ibpo_no" value={form.ibpo_no} onChange={handleChange}>
                              <option value="">Select Order...</option>
                              {orders.map(o => <option key={o.id} value={o.ibpo_number}>{o.ibpo_number} ({o.party_name})</option>)}
                            </select>
                          </div>
                          <div className="form-group"><label>Book No</label><input className="form-control" name="book_no" value={form.book_no || ''} onChange={handleChange} /></div>
                          <div className="form-group"><label>Page No</label><input className="form-control" name="page_no" value={form.page_no || ''} onChange={handleChange} /></div>
                        </div>
                      </div>

                      {/* Right Side: Saved IBPO Image (Larger View) */}
                      <div style={{ width: 470, flexShrink: 0, border: '1px dashed #cbd5e1', borderRadius: 8, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 250, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, alignSelf: 'flex-start' }}>IBPO Design Image</span>
                        {form.ibpo_image ? (
                          <img 
                            src={getBackendURL(form.ibpo_image)} 
                            alt="IBPO Design" 
                            style={{ width: '100%', maxHeight: 230, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => window.open(getBackendURL(form.ibpo_image), '_blank')}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                          />
                        ) : (
                          <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '40px 10px' }}>
                            No Image Found for Selected IBPO
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics, Weaving & Allowances Section (Full Width) */}
                  <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px solid var(--border)', maxWidth: '100%' }}>
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Metrics, Weaving & Allowances</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                        {/* ROW 1: Order Mtr / Ex Mtr / Total Mtr / Crmp % / SKG % */}
                        <div className="form-group"><label>Order Mtr</label><input type="number" className="form-control" name="order_mtr" value={form.order_mtr} onChange={handleChange} /></div>
                        <div className="form-group"><label>Ex Mtr</label><input type="number" className="form-control" name="ex_mtr" value={form.ex_mtr} onChange={handleChange} /></div>
                        <div className="form-group"><label>Total Mtr</label><input type="number" className="form-control" name="total_mtr" value={form.total_mtr} onChange={handleChange} /></div>
                        <div className="form-group"><label>Crmp %</label><input type="number" className="form-control" name="crimp_pct" value={form.crimp_pct} onChange={handleChange} /></div>
                        <div className="form-group"><label>SKG %</label><input type="number" className="form-control" name="skg_pct" value={form.skg_pct} onChange={handleChange} /></div>
                        
                        {/* ROW 2: Warp Mtr / Weft (Pro) Mtr | Gray Width / Finish Width / Reed OL */}
                        <div className="form-group"><label>Warp Mtr</label><input type="number" className="form-control" name="warp_mtr" value={form.warp_mtr} onChange={handleChange} /></div>
                        <div className="form-group"><label>Weft (Pro) Mtr</label><input type="number" className="form-control" name="weft_pro_mtr" value={form.weft_pro_mtr} onChange={handleChange} /></div>
                        <div className="form-group"><label>Gray Width</label><input type="number" className="form-control" name="gray_width" value={form.gray_width} onChange={handleChange} /></div>
                        <div className="form-group"><label>Finish Width</label><input type="number" className="form-control" name="finish_width" value={form.finish_width} onChange={handleChange} /></div>
                        <div className="form-group"><label>Reed OL</label><input type="number" className="form-control" name="reed_ol" value={form.reed_ol} onChange={handleChange} /></div>
                        
                        {/* ROW 3: Pick OT / Reed / Fabric / Total Ends / Warp Width */}
                        <div className="form-group"><label>Pick OT</label><input type="number" className="form-control" name="pick_ot" value={form.pick_ot} onChange={handleChange} /></div>
                        <div className="form-group"><label>Reed</label><input type="number" className="form-control" name="reed" value={form.reed} onChange={handleChange} /></div>
                        <div className="form-group"><label>Fabric</label>
                          <select className="form-control" name="fabric" value={form.fabric} onChange={handleChange}>
                            <option value="">Select Fabric...</option>
                            <option>Cotton</option><option>Polyester</option><option>Blended</option><option>Silk</option>
                            {form.fabric && !['Cotton', 'Polyester', 'Blended', 'Silk'].includes(form.fabric) && (
                              <option value={form.fabric}>{form.fabric}</option>
                            )}
                          </select>
                        </div>
                        <div className="form-group"><label>Total Ends</label><input type="number" className="form-control" name="total_ends" value={form.total_ends} onChange={handleChange} /></div>
                        <div className="form-group"><label>Warp Width</label><input type="number" className="form-control" name="warp_width" value={form.warp_width} onChange={handleChange} /></div>
                        
                        {/* ROW 4: GLM / Tole % / Selvage Waste / Weaving / Design Type */}
                        <div className="form-group"><label>GLM</label><input type="number" className="form-control" name="qlm" value={form.qlm} onChange={handleChange} /></div>
                        <div className="form-group"><label>Tole %</label><input type="number" className="form-control" name="toie_pct" value={form.toie_pct} onChange={handleChange} /></div>
                        <div className="form-group"><label>Selvage Waste</label><input type="number" className="form-control" name="selvage_waste" value={form.selvage_waste} onChange={handleChange} /></div>
                        <div className="form-group"><label>Weaving</label>
                          <select className="form-control" name="weaving" value={form.weaving} onChange={handleChange}>
                            <option value="">Select Weaving...</option>
                            <option>Plain</option><option>Twill</option><option>Satin</option><option>Jacquard</option>
                            {form.weaving && !['Plain', 'Twill', 'Satin', 'Jacquard'].includes(form.weaving) && (
                              <option value={form.weaving}>{form.weaving}</option>
                            )}
                          </select>
                        </div>
                        <div className="form-group"><label>Design Type</label>
                          <select className="form-control" name="design_type" value={form.design_type} onChange={handleChange}>
                            <option>Normal</option><option>Special</option><option>Sample</option>
                          </select>
                        </div>
                        
                        {/* ROW 5: Packing Less / Weight Grm / Dyeing Loss % */}
                        <div className="form-group"><label>Packing Less</label><input type="number" className="form-control" name="packing_less" value={form.packing_less} onChange={handleChange} /></div>
                        <div className="form-group"><label>Weight Grm</label><input type="number" className="form-control" name="weight_grm" value={form.weight_grm} onChange={handleChange} /></div>
                        <div className="form-group"><label>Dyeing Loss %</label><input type="number" className="form-control" name="dyeing_loss_pct" value={form.dyeing_loss_pct} onChange={handleChange} /></div>
                        <div className="form-group"></div>
                        <div className="form-group"></div>
                      </div>
                    </div>

                    {/* Right Column: Yarn Count Specifications Table */}
                    <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn Count Specifications</h4>
                      <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="data-table" style={{ fontSize: 12, width: '100%', minWidth: 800 }}>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Yarn Count</th>
                              <th>Act Count</th>
                              <th>End's</th>
                              <th>PICK</th>
                              <th>Crimp %</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {yarnRows.map((row, idx) => {
                              const isEditing = editingYarnIdx === idx && editingYarnRow;
                              if (isEditing) {
                                return (
                                  <tr key={row.id || idx}>
                                    <td>
                                      <select
                                        className="form-control"
                                        style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 120 }}
                                        value={editingYarnRow.type}
                                        onChange={e => setEditingYarnRow({ ...editingYarnRow, type: e.target.value })}
                                      >
                                        <option value="">Select...</option>
                                        <option>Warp</option>
                                        <option>Weft</option>
                                        {options.masters_with_ids?.yarn_spec_type_master?.map(t => (
                                          <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td>
                                      <select
                                        className="form-control"
                                        style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, minWidth: 100 }}
                                        value={editingYarnRow.yarn_count}
                                        onChange={e => {
                                          const val = e.target.value;
                                          const act = calculateActCount(val);
                                          setEditingYarnRow({ ...editingYarnRow, yarn_count: val, act_count: act });
                                        }}
                                      >
                                        <option value="">Select...</option>
                                        {yarnCountMasters.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                                      </select>
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-control"
                                        style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 60 }}
                                        value={editingYarnRow.act_count}
                                        onChange={e => setEditingYarnRow({ ...editingYarnRow, act_count: e.target.value })}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-control"
                                        style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 60 }}
                                        value={editingYarnRow.ends}
                                        onChange={e => setEditingYarnRow({ ...editingYarnRow, ends: e.target.value })}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-control"
                                        style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 60 }}
                                        placeholder="Pick"
                                        value={editingYarnRow.pick || ''}
                                        onChange={e => setEditingYarnRow({ ...editingYarnRow, pick: e.target.value })}
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-control"
                                        style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 60 }}
                                        value={editingYarnRow.crimp_pct}
                                        onChange={e => setEditingYarnRow({ ...editingYarnRow, crimp_pct: e.target.value })}
                                      />
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          style={{ padding: '2px 6px', fontSize: 11 }}
                                          onClick={() => saveEditYarnRow(idx)}
                                        >
                                          ✓
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          style={{ padding: '2px 6px', fontSize: 11 }}
                                          onClick={() => {
                                            setEditingYarnIdx(null);
                                            setEditingYarnRow(null);
                                          }}
                                        >
                                          ✗
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                              
                              return (
                                <tr key={row.id || idx}>
                                  <td style={{ fontWeight: 600 }}>{row.type}</td>
                                  <td>{row.yarn_count}</td>
                                  <td>{row.act_count}</td>
                                  <td>{row.ends}</td>
                                  <td>{row.pick || '-'}</td>
                                  <td>{row.crimp_pct}%</td>
                                  <td>
                                    {!isReadOnly && (
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 8px' }}
                                          onClick={() => startEditYarnRow(idx)}
                                          title="Edit Row"
                                        >
                                          <Edit2 size={14} color="var(--primary)" />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 8px' }}
                                          onClick={() => deleteYarnRow(idx)}
                                          title="Delete Row"
                                        >
                                          <Trash2 size={14} color="#ef4444" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {!isReadOnly && (
                              <tr>
                                <td>
                                  <div style={{ minWidth: 120 }}>
                                    {isCustomYarnTypeMode ? (
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <input
                                          ref={yarnTypeSelectRef}
                                          type="text"
                                          className="form-control"
                                          style={{ width: 120, padding: '4px 6px', margin: 0 }}
                                          placeholder="New Type"
                                          value={customYarnTypeVal}
                                          onChange={e => setCustomYarnTypeVal(e.target.value)}
                                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveCustomYarnSpecType(); } }}
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          onClick={handleSaveCustomYarnSpecType}
                                          style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}
                                        >
                                          ✓
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          onClick={() => {
                                            setIsCustomYarnTypeMode(false);
                                            setNewYarnRow(prev => ({ ...prev, type: 'Warp' }));
                                          }}
                                          style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}
                                        >
                                          ✗
                                        </button>
                                      </div>
                                    ) : (
                                      <select
                                        ref={yarnTypeSelectRef}
                                        className="form-control"
                                        style={{ padding: '4px 6px', margin: 0, minWidth: 120 }}
                                        value={newYarnRow.type}
                                        onChange={e => {
                                          if (e.target.value === 'custom') {
                                            setIsCustomYarnTypeMode(true);
                                            setCustomYarnTypeVal('');
                                            setNewYarnRow(prev => ({ ...prev, type: 'custom' }));
                                          } else {
                                            setNewYarnRow(prev => ({ ...prev, type: e.target.value }));
                                          }
                                        }}
                                      >
                                        <option value="">Select...</option>
                                        {options.masters_with_ids?.yarn_spec_type_master?.map(t => (
                                          <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                        <option value="custom" style={{ color: 'var(--primary)', fontWeight: 600 }}>+ Add Custom...</option>
                                      </select>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <select
                                    className="form-control"
                                    style={{ padding: '4px 6px', margin: 0, minWidth: 100 }}
                                    value={newYarnRow.yarn_count}
                                    onChange={e => {
                                      const val = e.target.value;
                                      const act = calculateActCount(val);
                                      setNewYarnRow(prev => ({
                                        ...prev,
                                        yarn_count: val,
                                        act_count: act
                                      }));
                                    }}
                                  >
                                    <option value="">Select...</option>
                                    {yarnCountMasters.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ padding: '4px 6px', margin: 0 }}
                                    placeholder="Act"
                                    value={newYarnRow.act_count}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, act_count: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addYarnRow(); } }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ padding: '4px 6px', margin: 0 }}
                                    placeholder="Ends"
                                    value={newYarnRow.ends}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, ends: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addYarnRow(); } }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ padding: '4px 6px', margin: 0 }}
                                    placeholder="Pick"
                                    value={newYarnRow.pick || ''}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, pick: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addYarnRow(); } }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ padding: '4px 6px', margin: 0 }}
                                    placeholder="Crimp"
                                    value={newYarnRow.crimp_pct}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, crimp_pct: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addYarnRow(); } }}
                                  />
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ padding: '6px 10px', background: '#10b981', borderColor: '#10b981' }}
                                    onClick={addYarnRow}
                                  >
                                    Add
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                {/* Fabric Design Blue Header bar */}
                <div style={{
                  background: '#1e3a8a',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '6px 6px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 32
                }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Fabric Design</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      id="fabric-design-file"
                      style={{ display: 'none' }}
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setSelectedFiles(files);
                          setSelectedFile(files[0]);
                          setImagePreviewUrl(URL.createObjectURL(files[0]));
                        }
                      }}
                      disabled={isReadOnly}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', background: '#fff', color: '#1e3a8a', fontWeight: 600 }}
                      onClick={() => document.getElementById('fabric-design-file').click()}
                      disabled={isReadOnly}
                    >
                      Choose File(s)
                    </button>
                    {!isReadOnly && selectedFile && (
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '4px 12px', background: '#10b981', color: '#fff', fontWeight: 600 }}
                        onClick={handleUploadImageOnly}
                      >
                        Upload
                      </button>
                    )}
                    {!isReadOnly && selectedFiles.length > 0 && (
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '4px 12px', background: '#3b82f6', color: '#fff', fontWeight: 600 }}
                        onClick={() => handleExtractDesign(selectedFiles)}
                        disabled={isExtracting}
                      >
                        {isExtracting ? "Extracting..." : "Extract AI Data"}
                      </button>
                    )}
                    {!isReadOnly && fabricDesignRows.length > 0 && (
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', fontWeight: 600 }}
                        onClick={async () => {
                          const confirmed = await confirmDialog({
                            title: 'Clear Fabric Design Table',
                            message: 'Are you sure you want to clear the Fabric Design table?',
                            type: 'delete',
                            confirmText: 'Clear'
                          });
                          if (confirmed) {
                            setFabricDesignRows([]);
                          }
                        }}
                      >
                        Clear Table
                      </button>
                    )}
                    <span style={{ fontSize: 13, color: '#e5e7eb', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFiles.length > 0 
                        ? `${selectedFiles.length} file(s) selected` 
                        : (selectedFile ? selectedFile.name : (imagePreviewUrl ? "Design image loaded" : "No file chosen"))}
                    </span>
                    {imagePreviewUrl && (
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '4px 12px', background: '#f59e0b', color: '#fff', fontWeight: 600 }}
                        onClick={() => {
                          window.open(getBackendURL(imagePreviewUrl), '_blank');
                        }}
                      >
                        View Image
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '4px 12px', background: '#f59e0b', color: '#fff', fontWeight: 600 }}
                      onClick={() => setShowPatternModal(true)}
                    >
                      View Design
                    </button>
                  </div>
                </div>

                {/* Fabric Design Specifications Table */}
                <div className="card" style={{ padding: 0, borderRadius: '0 0 6px 6px', borderTop: 'none', overflowX: 'auto', marginBottom: 24, width: '100%' }}>
                  <table className="data-table" style={{ fontSize: 12, width: '100%', minWidth: 1200 }}>
                    <thead>
                      <tr>
                        <th>S. No</th>
                        <th>Type</th>
                        <th>Yarn Count</th>
                        <th>Color</th>
                        <th>Threads</th>
                        <th>Times</th>
                        <th>Line</th>
                        <th>Pick</th>
                        <th>Drawing Order</th>
                        <th>DENTS</th>
                        <th>Line</th>
                        <th>ENDS FOR DENTS</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const timesSpans = getRowSpans(fabricDesignRows, 'times');
                        const drawingSpans = getRowSpans(fabricDesignRows, 'drawing_order');
                        
                        const updateRowValue = (rIdx, field, val) => {
                          const updated = [...fabricDesignRows];
                          updated[rIdx] = { ...updated[rIdx], [field]: val };
                          setFabricDesignRows(updated);
                        };

                        const updateBracketValue = (startIdx, key, val, span) => {
                          const updated = [...fabricDesignRows];
                          for (let k = 0; k < span; k++) {
                            updated[startIdx + k] = { ...updated[startIdx + k], [key]: val };
                          }
                          setFabricDesignRows(updated);
                        };

                        return fabricDesignRows.map((row, idx) => {
                          const colorCode = getColorHex(row.color, colorMasters);
                          
                          if (isReadOnly) {
                            return (
                              <tr key={row.id || idx}>
                                <td>{idx + 1}</td>
                                <td style={{ fontWeight: 600 }}>{row.type}</td>
                                <td>{row.yarn_count}</td>
                                <td>
                                  <span style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: 6 
                                  }}>
                                    <span style={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      background: colorCode,
                                      border: '1px solid #999'
                                    }} />
                                    {row.color}
                                  </span>
                                </td>
                                <td>{row.threads}</td>
                                {timesSpans[idx]?.isStart && renderBracketCell(row.times, timesSpans[idx]?.span)}
                                <td>{row.line || '-'}</td>
                                <td>{row.pick || '-'}</td>
                                {drawingSpans[idx]?.isStart && renderBracketCell(row.drawing_order, drawingSpans[idx]?.span)}
                                <td>{row.dents || '-'}</td>
                                <td>{row.line_val || '-'}</td>
                                <td>{row.ends_for_dents || '-'}</td>
                                <td></td>
                              </tr>
                            );
                          }

                          // Editable view
                          const isEditing = editingFabricIdx === idx && editingFabricRow;
                          if (isEditing) {
                            const uniqueTypesVal = editingFabricRow.type && !uniqueTypes.includes(editingFabricRow.type)
                              ? [...uniqueTypes, editingFabricRow.type]
                              : uniqueTypes;

                            const uniqueCountsVal = editingFabricRow.yarn_count && !uniqueCounts.includes(editingFabricRow.yarn_count)
                              ? [...uniqueCounts, editingFabricRow.yarn_count]
                              : uniqueCounts;

                            const colorOptions = [...colorMasters];
                            if (editingFabricRow.color && !colorOptions.some(o => o.name === editingFabricRow.color)) {
                              colorOptions.push({ id: 'temp-' + editingFabricRow.color, name: editingFabricRow.color });
                            }

                            const editColorCode = getColorHex(editingFabricRow.color, colorMasters);

                            return (
                              <tr key={row.id || idx}>
                                <td>{idx + 1}</td>
                                <td>
                                  <select 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 70 }}
                                    value={editingFabricRow.type}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, type: e.target.value })}
                                  >
                                    <option value="">Select...</option>
                                    {uniqueTypesVal.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </td>
                                <td>
                                  <select 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, minWidth: 80 }}
                                    value={editingFabricRow.yarn_count}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, yarn_count: e.target.value })}
                                  >
                                    <option value="">Select...</option>
                                    {uniqueCountsVal.map(y => <option key={y} value={y}>{y}</option>)}
                                  </select>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ 
                                      width: 10, 
                                      height: 10, 
                                      borderRadius: '50%', 
                                      background: editColorCode,
                                      border: '1px solid #999',
                                      flexShrink: 0
                                    }} />
                                    <select 
                                      className="form-control" 
                                      style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, minWidth: 80 }}
                                      value={editingFabricRow.color}
                                      onChange={e => setEditingFabricRow({ ...editingFabricRow, color: e.target.value })}
                                    >
                                      <option value="">Select...</option>
                                      {colorOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                  </div>
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 50 }}
                                    value={editingFabricRow.threads}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, threads: e.target.value })}
                                  />
                                </td>
                                {timesSpans[idx]?.isStart && (
                                  <td 
                                    rowSpan={timesSpans[idx]?.span} 
                                    style={{ 
                                      verticalAlign: 'middle', 
                                      textAlign: 'center', 
                                      padding: '4px 8px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #ccc'
                                    }}
                                  >
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 40, textAlign: 'center', fontWeight: 600 }}
                                      value={editingFabricRow.times || '1'}
                                      onChange={e => setEditingFabricRow({ ...editingFabricRow, times: e.target.value })}
                                    />
                                  </td>
                                )}
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 50 }}
                                    value={editingFabricRow.line || ''}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, line: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 50 }}
                                    value={editingFabricRow.pick || ''}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, pick: e.target.value })}
                                  />
                                </td>
                                {drawingSpans[idx]?.isStart && (
                                  <td 
                                    rowSpan={drawingSpans[idx]?.span} 
                                    style={{ 
                                      verticalAlign: 'middle', 
                                      textAlign: 'center', 
                                      padding: '4px 8px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #ccc'
                                    }}
                                  >
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 40, textAlign: 'center', fontWeight: 600 }}
                                      value={editingFabricRow.drawing_order || ''}
                                      onChange={e => setEditingFabricRow({ ...editingFabricRow, drawing_order: e.target.value })}
                                    />
                                  </td>
                                )}
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 50 }}
                                    value={editingFabricRow.dents || ''}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, dents: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 50 }}
                                    value={editingFabricRow.line_val || ''}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, line_val: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '2px 4px', fontSize: 11, margin: 0, height: 26, width: 50 }}
                                    value={editingFabricRow.ends_for_dents || ''}
                                    onChange={e => setEditingFabricRow({ ...editingFabricRow, ends_for_dents: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      style={{ padding: '2px 6px', fontSize: 11 }}
                                      onClick={() => saveEditFabricRow(idx)}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ padding: '2px 6px', fontSize: 11 }}
                                      onClick={() => {
                                        setEditingFabricIdx(null);
                                        setEditingFabricRow(null);
                                      }}
                                    >
                                      ✗
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Non-editing view
                          return (
                            <tr key={row.id || idx}>
                              <td>{idx + 1}</td>
                              <td style={{ fontWeight: 600 }}>{row.type}</td>
                              <td>{row.yarn_count}</td>
                              <td>
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 6 
                                }}>
                                  <span style={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    background: colorCode,
                                    border: '1px solid #999'
                                  }} />
                                  {row.color}
                                </span>
                              </td>
                              <td>{row.threads}</td>
                              {timesSpans[idx]?.isStart && renderBracketCell(row.times, timesSpans[idx]?.span)}
                              <td>{row.line || '-'}</td>
                              <td>{row.pick || '-'}</td>
                              {drawingSpans[idx]?.isStart && renderBracketCell(row.drawing_order, drawingSpans[idx]?.span)}
                              <td>{row.dents || '-'}</td>
                              <td>{row.line_val || '-'}</td>
                              <td>{row.ends_for_dents || '-'}</td>
                              <td>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 8px' }}
                                    onClick={() => startEditFabricRow(idx)}
                                    title="Edit Row"
                                  >
                                    <Edit2 size={14} color="var(--primary)" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 8px' }}
                                    onClick={() => deleteFabricDesignRow(idx)}
                                    title="Delete Row"
                                  >
                                    <Trash2 size={14} color="#ef4444" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                      {!isReadOnly && (
                        <tr>
                          <td>New</td>
                          <td>
                            <select
                              ref={fabricTypeSelectRef}
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0, minWidth: 70 }}
                              value={newFabricDesignRow.type}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, type: e.target.value })}
                            >

                              <option value="">Select...</option>
                              {uniqueTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0, minWidth: 100 }}
                              value={newFabricDesignRow.yarn_count}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, yarn_count: e.target.value })}
                            >
                              <option value="">Select...</option>
                              {uniqueCounts.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0, minWidth: 100 }}
                              value={newFabricDesignRow.color}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, color: e.target.value })}
                            >
                              <option value="">Select...</option>
                              {colorMasters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Threads"
                              value={newFabricDesignRow.threads}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, threads: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Times"
                              value={newFabricDesignRow.times}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, times: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Line"
                              value={newFabricDesignRow.line}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, line: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Pick"
                              value={newFabricDesignRow.pick}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, pick: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Drawing"
                              value={newFabricDesignRow.drawing_order}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, drawing_order: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Dents"
                              value={newFabricDesignRow.dents}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, dents: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Line"
                              value={newFabricDesignRow.line_val}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, line_val: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Ends/Dent"
                              value={newFabricDesignRow.ends_for_dents}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, ends_for_dents: e.target.value })}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 10px', background: '#10b981', borderColor: '#10b981' }}
                              onClick={addFabricDesignRow}
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Design Requirement - Summary Section */}
                {form.ibpo_no && (
                  <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px solid var(--border)', marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>
                      <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Design Requirement - Summary</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isSummaryManuallyEdited ? (
                          <>
                            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>Manually Overridden</span>
                            {!isReadOnly && (
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => setIsSummaryManuallyEdited(false)}
                              >
                                Reset to Auto-calculated
                              </button>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '2px 8px', borderRadius: 4 }}>Auto-calculated</span>
                        )}
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table className="table table-bordered" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', width: 120 }}>Beam Type</th>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', width: 120 }}>Count</th>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', width: 120 }}>Color</th>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right', width: 90 }}>Ends</th>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right', width: 90 }}>No D</th>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right', width: 90 }}>Extra</th>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right', width: 110 }}>Total End</th>
                            <th style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right', width: 110 }}>Req kg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Warp Summary Rows */}
                          {warpSummary.map((row, index) => {
                            const colorCode = getColorHex(row.color, colorMasters);
                            return (
                              <tr key={`warp-sum-${index}`}>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)', fontWeight: 600 }}>{row.beam_type || 'Warp'}</td>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)' }}>{row.count}</td>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: colorCode, border: '1px solid #999' }} />
                                    {row.color}
                                  </div>
                                </td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.ends || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.ends ?? ''}
                                      onChange={e => handleWarpSummaryChange(index, 'ends', e.target.value)}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.noD || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.noD ?? ''}
                                      onChange={e => handleWarpSummaryChange(index, 'noD', e.target.value)}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.extra || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.extra ?? ''}
                                      onChange={e => handleWarpSummaryChange(index, 'extra', e.target.value)}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.total_ends || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.total_ends ?? ''}
                                      onChange={e => handleWarpSummaryChange(index, 'total_ends', e.target.value)}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.req_kg || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.req_kg ?? ''}
                                      onChange={e => handleWarpSummaryChange(index, 'req_kg', e.target.value)}
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Warp Subtotal Row */}
                          {warpSummary.length > 0 && (
                            <tr style={{ background: '#f1f5f9', fontWeight: 600 }}>
                              <td colSpan={3} style={{ padding: '8px 12px', border: '1px solid var(--border)' }}>Warp Subtotal</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>{warpSubtotalEnds}</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>-</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>{warpSubtotalExtra}</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>{warpSubtotalTotalEnds}</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>{warpSubtotalKg}</td>
                            </tr>
                          )}

                          {/* Weft Summary Rows */}
                          {weftSummary.map((row, index) => {
                            const colorCode = getColorHex(row.color, colorMasters);
                            return (
                              <tr key={`weft-sum-${index}`}>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)', fontWeight: 600 }}>{row.beam_type || 'Weft'}</td>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)' }}>{row.count}</td>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: colorCode, border: '1px solid #999' }} />
                                    {row.color}
                                  </div>
                                </td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.ends || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.ends ?? ''}
                                      onChange={e => handleWeftSummaryChange(index, 'ends', e.target.value)}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>-</td>
                                <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>-</td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.total_ends || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.total_ends ?? ''}
                                      onChange={e => handleWeftSummaryChange(index, 'total_ends', e.target.value)}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '6px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>
                                  {isReadOnly ? (
                                    row.req_kg || 0
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={{ padding: '2px 6px', fontSize: 12, height: 26, width: '100%', textAlign: 'right', margin: 0 }}
                                      value={row.req_kg ?? ''}
                                      onChange={e => handleWeftSummaryChange(index, 'req_kg', e.target.value)}
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Weft Subtotal Row */}
                          {weftSummary.length > 0 && (
                            <tr style={{ background: '#f1f5f9', fontWeight: 600 }}>
                              <td colSpan={3} style={{ padding: '8px 12px', border: '1px solid var(--border)' }}>Weft Subtotal</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>{weftSubtotalEnds}</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>-</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>-</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>{weftSubtotalTotalEnds}</td>
                              <td style={{ padding: '8px 12px', border: '1px solid var(--border)', textAlign: 'right' }}>{weftSubtotalKg}</td>
                            </tr>
                          )}

                          {/* Grand Total Row */}
                          {(warpSummary.length > 0 || weftSummary.length > 0) && (
                            <tr style={{ background: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>
                              <td colSpan={7} style={{ padding: '10px 12px', border: '1px solid var(--border)', color: 'var(--primary)' }}>GRAND TOTAL REQUIREMENT</td>
                              <td style={{ padding: '10px 12px', border: '1px solid var(--border)', textAlign: 'right', color: 'var(--primary)' }}>{grandTotalKg} kg</td>
                            </tr>
                          )}
                          
                          {warpSummary.length === 0 && weftSummary.length === 0 && (
                            <tr>
                              <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                No fabric design specifications added yet. Add rows above to generate summary.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons at Bottom Right */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
                  {!isReadOnly && (
                    <button type="submit" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Design' : 'Save Design'}</button>
                  )}
                </div>
              </form>
            </fieldset>
          </div>
        </div>
      )}

      {showPatternModal && (() => {
        const getExpandedPattern = (rows, type) => {
          const isWeft = type && type.trim().toLowerCase() === 'weft';
          const filtered = rows.filter(r => {
            if (!r.type) return false;
            const rTypeLower = r.type.trim().toLowerCase();
            if (isWeft) {
              return rTypeLower.includes('weft');
            } else {
              return !rTypeLower.includes('weft');
            }
          });
          const spans = getRowSpans(filtered, 'times');
          
          const expanded = [];
          let i = 0;
          while (i < filtered.length) {
            const spanInfo = spans[i];
            if (spanInfo && spanInfo.isStart && spanInfo.span > 1) {
              const group = filtered.slice(i, i + spanInfo.span);
              const times = parseInt(spanInfo.value) || 1;
              for (let t = 0; t < times; t++) {
                for (const row of group) {
                  expanded.push({
                    color: row.color,
                    threads: parseFloat(row.threads) || 1
                  });
                }
              }
              i += spanInfo.span;
            } else {
              const row = filtered[i];
              const times = parseInt(row.times) || 1;
              for (let t = 0; t < times; t++) {
                expanded.push({
                  color: row.color,
                  threads: parseFloat(row.threads) || 1
                });
              }
              i++;
            }
          }
          if (expanded.length > 200) {
            return expanded.slice(0, 200);
          }
          return expanded;
        };

        const expandedWarp = getExpandedPattern(fabricDesignRows, 'Warp');
        const expandedWeft = getExpandedPattern(fabricDesignRows, 'Weft');

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: 750, padding: 24, background: '#fff', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary)', fontWeight: 700 }}>Fabric Design Preview</h3>
              <button 
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
                onClick={() => setShowPatternModal(false)}
              >
                <X size={20} />
              </button>
              <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
                <div>
                  <h5 style={{ fontWeight: 600, marginBottom: 8 }}>Warp Stripes Repeat Layout</h5>
                  <div style={{ display: 'flex', height: 40, border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
                    {expandedWarp.map((row, idx) => {
                      const colorCode = getColorHex(row.color, colorMasters);
                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            background: colorCode, 
                            flexGrow: row.threads,
                            height: '100%'
                          }} 
                          title={`Warp: ${row.threads} thds of ${row.color}`}
                        />
                      );
                    })}
                    {expandedWarp.length === 0 && (
                      <div style={{ padding: 8, color: '#999', fontSize: 13 }}>No Warp stripes configured.</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 style={{ fontWeight: 600, marginBottom: 8 }}>Weft Stripes Repeat Layout</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', height: 40, border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
                    {expandedWeft.map((row, idx) => {
                      const colorCode = getColorHex(row.color, colorMasters);
                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            background: colorCode, 
                            flexGrow: row.threads,
                            width: '100%'
                          }} 
                          title={`Weft: ${row.threads} thds of ${row.color}`}
                        />
                      );
                    })}
                    {expandedWeft.length === 0 && (
                      <div style={{ padding: 8, color: '#999', fontSize: 13 }}>No Weft stripes configured.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 style={{ fontWeight: 600, marginBottom: 8 }}>Grid Fabric Intersect (Simulated Weave)</h5>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: expandedWarp.length > 0 ? expandedWarp.map(w => `${w.threads}fr`).join(' ') : '1fr',
                    gridTemplateRows: expandedWeft.length > 0 ? expandedWeft.map(y => `${y.threads}fr`).join(' ') : '1fr',
                    height: 300, 
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    {expandedWeft.map((weftRow, rIdx) => {
                      const weftColor = getColorHex(weftRow.color, colorMasters);
                      return expandedWarp.map((warpRow, cIdx) => {
                        const warpColor = getColorHex(warpRow.color, colorMasters);
                        // Plain weave checkerboard pattern
                        const isWarpFacing = ((rIdx + cIdx) % 2 === 0);
                        return (
                          <div 
                            key={`${rIdx}-${cIdx}`} 
                            style={{ 
                              background: isWarpFacing ? warpColor : weftColor,
                              width: '100%',
                              height: '100%'
                            }} 
                          />
                        );
                      });
                    })}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <button className="btn btn-secondary" onClick={() => setShowPatternModal(false)}>Close Preview</button>
              </div>
            </div>
          </div>
        );
      })()}

      <DesignSheetModal
        isOpen={!!viewModalDesign}
        onClose={() => setViewModalDesign(null)}
        design={viewModalDesign}
        colorMasters={colorMasters}
      />

    </div>
  );
}

const calculateActCount = (yarnCountStr) => {
  if (!yarnCountStr) return '';
  const cleaned = yarnCountStr.trim();
  
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 2) {
      const num1Match = parts[0].match(/\d+/);
      const num2Match = parts[1].match(/\d+/);
      if (num1Match && num2Match) {
        const num1 = parseFloat(num1Match[0]);
        const num2 = parseFloat(num2Match[0]);
        if (num1 > 0 && num2 > 0) {
          const maxNum = Math.max(num1, num2);
          const minNum = Math.min(num1, num2);
          return (maxNum / minNum).toString();
        }
      }
    }
  } else {
    const match = cleaned.match(/\d+/);
    if (match) {
      return match[0];
    }
  }
  return '';
};
