import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingCart, Package, Receipt, ClipboardList, MapPin,
  TrendingUp, Activity, Filter, Clock, Layers, Scissors, Box, 
  CheckSquare, Factory, ChevronRight, BarChart3, Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { dashboardAPI } from '../../services/api';

// Base Mock Data (Templates)
const getPastDateLabel = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const baseDailyProductionData = [
  { daysAgo: 6, Vendor: 12, Checking: 8, GreyDelivery: 10 },
  { daysAgo: 5, Vendor: 19, Checking: 12, GreyDelivery: 14 },
  { daysAgo: 4, Vendor: 15, Checking: 10, GreyDelivery: 11 },
  { daysAgo: 3, Vendor: 22, Checking: 16, GreyDelivery: 18 },
  { daysAgo: 2, Vendor: 25, Checking: 18, GreyDelivery: 20 },
  { daysAgo: 1, Vendor: 21, Checking: 14, GreyDelivery: 16 },
  { daysAgo: 0, Vendor: 8, Checking: 4, GreyDelivery: 6 },
];

const getInitialDailyProductionData = () => {
  return baseDailyProductionData.map(item => ({
    ...item,
    name: getPastDateLabel(item.daysAgo)
  }));
};

const baseProdVsDispatchData = [
  { month: 'Jan', Production: 40000, Dispatch: 32000 },
  { month: 'Feb', Production: 45000, Dispatch: 38000 },
  { month: 'Mar', Production: 52000, Dispatch: 46000 },
  { month: 'Apr', Production: 48000, Dispatch: 42000 },
  { month: 'May', Production: 61000, Dispatch: 55000 },
  { month: 'Jun', Production: 58000, Dispatch: 57000 },
];

const baseBottleneckData = [
  { process: 'Warping', pending: 15 },
  { process: 'Weaving', pending: 28 },
  { process: 'Dyeing', pending: 42 },
  { process: 'Checking', pending: 19 },
  { process: 'Packing', pending: 8 },
];



const baseBuyerQtyData = [
  { name: 'SK Textiles', qty: 45000 },
  { name: 'Mani Spinners', qty: 32000 },
  { name: 'Global Exim', qty: 28000 },
  { name: 'A1 Garments', qty: 22000 },
  { name: 'Raju Traders', qty: 15000 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Filters State
  const [dateFilter, setDateFilter] = useState('This Month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Operations and Charts State
  const [operations, setOperations] = useState([]);
  const [dailyProduction, setDailyProduction] = useState(getInitialDailyProductionData());
  const [prodVsDispatch, setProdVsDispatch] = useState(baseProdVsDispatchData);
  const [bottlenecks, setBottlenecks] = useState(baseBottleneckData);
  const [buyerQty, setBuyerQty] = useState(baseBuyerQtyData);

  // Dropdown UI state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Load Initial API Stats
  useEffect(() => {
    dashboardAPI.stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter application logic
  const applyFilters = () => {
    let factor = 1.0;
    
    if (dateFilter === 'This Week') {
      factor = 0.45;
    } else if (dateFilter === 'This Month') {
      factor = 1.0;
    } else if (dateFilter === 'This Year') {
      factor = 8.5;
    } else if (dateFilter === 'Custom Range') {
      if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        factor = Math.min(Math.max(diffDays / 30, 0.1), 12.0);
      } else {
        factor = 0.7; // default fallback if dates not filled
      }
    }

    // 1. Update Daily Operations Panel metrics
    const updatedOps = [
      { label: 'Vendor Inward', value: `${Math.round(14 * factor) || 1} Rolls`, path: '/cloth/inward', color: '#10b981', icon: Factory },
      { label: 'Purchase Inward', value: `${(Math.round(2450 * factor) || 100).toLocaleString()} Kgs`, path: '/yarn/inward', color: '#22c55e', icon: Layers },
      { label: 'Process Delivery', value: `${Math.round(8 * factor) || 1} Batches`, path: '/yarn/grey-delivery', color: '#64748b', icon: Clock },
      { label: 'Process Inward', value: `${Math.round(12 * factor) || 1} Bags`, path: '/dyed-yarn/received', color: '#ec4899', icon: Layers },
      { label: 'Sales Delivery', value: `${Math.round(6 * factor) || 1} Deliveries`, path: '/despatch', color: '#3b82f6', icon: MapPin },
      { label: 'IMPO', value: `${Math.round(18 * factor) || 2} Orders`, path: '/yarn/inward', color: '#ea580c', icon: ShoppingCart },
      { label: 'IMBO', value: `${Math.round(14 * factor) || 1} Lots`, path: '/cloth/inward', color: '#a855f7', icon: Package },
      { label: 'Total DC', value: `${Math.round(22 * factor) || 2} Challans`, path: '/despatch', color: '#06b6d4', icon: Receipt },
      { label: 'Total Qty', value: `${(Math.round(15800 * factor) || 1000).toLocaleString()} Mtrs`, path: '/sales-invoice', color: '#10b981', icon: BarChart3 }
    ];
    setOperations(updatedOps);

    // 2. Update Daily Production Chart
    const updatedDailyProd = baseDailyProductionData.map(item => ({
      ...item,
      name: getPastDateLabel(item.daysAgo),
      Vendor: Math.round(item.Vendor * (factor < 1 ? factor : 0.8 + Math.random() * 0.4)),
      Checking: Math.round(item.Checking * (factor < 1 ? factor : 0.8 + Math.random() * 0.4)),
      GreyDelivery: Math.round(item.GreyDelivery * (factor < 1 ? factor : 0.8 + Math.random() * 0.4)),
    }));
    setDailyProduction(updatedDailyProd);

    // 3. Update Production vs Dispatch Chart
    const updatedProdVsDispatch = baseProdVsDispatchData.map(item => ({
      ...item,
      Production: Math.round(item.Production * factor),
      Dispatch: Math.round(item.Dispatch * factor)
    }));
    setProdVsDispatch(updatedProdVsDispatch);

    // 4. Update Bottleneck Chart
    const updatedBottlenecks = baseBottleneckData.map(item => ({
      ...item,
      pending: Math.round(item.pending * (factor < 1 ? factor : 0.9 + Math.random() * 0.25))
    }));
    setBottlenecks(updatedBottlenecks);

    // 5. Update Buyer-wise Qty Chart
    const updatedBuyerQty = baseBuyerQtyData.map(item => ({
      ...item,
      qty: Math.round(item.qty * factor)
    }));
    setBuyerQty(updatedBuyerQty);
  };

  // Run filter logic automatically whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [dateFilter, fromDate, toDate, stats]);

  // Export to Excel function
  const exportToExcel = () => {
    // 1. Prepare Daily Operations
    const opsData = operations.map(op => ({
      'Metric/Operation': op.label,
      'Current Value': op.value,
      'Target Route': op.path
    }));

    // 2. Prepare Daily Production Chart
    const prodData = dailyProduction.map(d => ({
      'Day': d.name,
      'Vendor (Rolls)': d.Vendor,
      'Checking (Lots)': d.Checking,
      'Grey Delivery (Batches)': d.GreyDelivery
    }));

    // 3. Prepare Production vs Dispatch
    const pvdData = prodVsDispatch.map(item => ({
      'Month': item.month,
      'Production (Meters)': item.Production,
      'Dispatch (Meters)': item.Dispatch
    }));

    // 4. Prepare Bottlenecks
    const bnData = bottlenecks.map(b => ({
      'Process Step': b.process,
      'Pending Lots/Orders': b.pending
    }));

    // 5. Prepare Buyer-wise Qty
    const bqData = buyerQty.map(bq => ({
      'Buyer Name': bq.name,
      'Quantity Ordered (Meters)': bq.qty
    }));

    // Create Workbook
    const wb = XLSX.utils.book_new();

    // Add Sheets
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(opsData), 'Daily Operations');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodData), 'Daily Production');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pvdData), 'Prod vs Dispatch');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bnData), 'Bottlenecks');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bqData), 'Buyer Quantity');

    // Save File
    XLSX.writeFile(wb, `Dinesh_Textile_Dashboard_Report_${dateFilter}.xlsx`);
  };

  // Export to PDF function
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Title / Header styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138); // Dark Blue
      doc.text('Dinesh Export Textile ERP', 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139); // Slate Gray
      doc.text('Dashboard Operational Summary Report', 14, 28);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${dateFilter}`, 14, 34);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 40);

      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 44, 196, 44);

      // Section 1: Daily Operations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text('A. Daily Operations Metrics', 14, 52);

      const opsHeaders = [['Operation/Module', 'Current Volume/Value', 'Status']];
      const opsRows = operations.map(op => [op.label, op.value, 'Active/Normal']);

      autoTable(doc, {
        startY: 56,
        head: opsHeaders,
        body: opsRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 }
      });

      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 56;

      // Section 2: Production vs Dispatch
      doc.setFont('helvetica', 'bold');
      doc.text('B. Production vs Dispatch Performance', 14, finalY + 15);

      const pvdHeaders = [['Month', 'Fabric Production (Mtrs)', 'Fabric Dispatch (Mtrs)']];
      const pvdRows = prodVsDispatch.map(item => [item.month, item.Production.toLocaleString(), item.Dispatch.toLocaleString()]);

      autoTable(doc, {
        startY: finalY + 19,
        head: pvdHeaders,
        body: pvdRows,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 }
      });

      finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 19;

      // Page overflow control for Section 3
      if (finalY + 60 > 280) {
        doc.addPage();
        finalY = 20;
      } else {
        finalY = finalY + 15;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('C. Process Bottlenecks & Buyer Quantities', 14, finalY);

      const bqHeaders = [['Buyer Name', 'Quantity (Mtrs)', 'Process Step', 'Pending Lots']];
      const maxLength = Math.max(buyerQty.length, bottlenecks.length);
      const zipRows = [];
      for (let i = 0; i < maxLength; i++) {
        const buyer = buyerQty[i] || { name: '-', qty: 0 };
        const bn = bottlenecks[i] || { process: '-', pending: 0 };
        zipRows.push([
          buyer.name, 
          buyer.qty ? buyer.qty.toLocaleString() : '-', 
          bn.process, 
          bn.pending ? bn.pending.toString() : '-'
        ]);
      }

      autoTable(doc, {
        startY: finalY + 4,
        head: bqHeaders,
        body: zipRows,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Dinesh_Textile_Dashboard_Report_${dateFilter}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const renderMetricGrid = (title, items) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              background: 'var(--bg-primary)',
              border: `1.5px solid ${item.color}25`,
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = `${item.color}25`;
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {/* Top Row: Icon and Label */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                {item.label}
              </span>
              {item.icon && (
                <div style={{ color: item.color, background: `${item.color}12`, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <item.icon size={16} />
                </div>
              )}
            </div>

            {/* Bottom Row: Value */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-primary)' }}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Welcome back! Here is a live overview of factory metrics and textile operations.</p>
        </div>
        
        {/* Date Filters & Export Dropdown Card */}
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row', width: 'auto', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>
          
          <select 
            className="form-control" 
            style={{ width: 140, padding: '8px 12px' }} 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value)}
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
            <option value="Custom Range">Custom Range</option>
          </select>

          {dateFilter === 'Custom Range' && (
            <>
              <input 
                type="date" 
                className="form-control" 
                style={{ width: 130, padding: '8px' }} 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="form-control" 
                style={{ width: 130, padding: '8px' }} 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
              />
            </>
          )}

          {/* Single Dropdown Export Button */}
          <div style={{ position: 'relative', borderLeft: '1.5px solid var(--border)', paddingLeft: 16, display: 'inline-block' }}>
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, height: 38, cursor: 'pointer' }}
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            >
              <Download size={15} />
              <span>Export</span>
            </button>
            
            {exportDropdownOpen && (
              <>
                <div 
                  onClick={() => setExportDropdownOpen(false)} 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                />
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 999,
                  minWidth: 160,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <button 
                    onClick={() => {
                      setExportDropdownOpen(false);
                      exportToPDF();
                    }}
                    style={{
                      padding: '10px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      width: '100%'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Download as PDF
                  </button>
                  <button 
                    onClick={() => {
                      setExportDropdownOpen(false);
                      exportToExcel();
                    }}
                    style={{
                      padding: '10px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      width: '100%',
                      borderTop: '1px solid var(--border)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Download as Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Panels Grid */}
      {renderMetricGrid('A. Daily Operations Panel', operations)}

      {/* Daily Operations Activity Chart - Full Width */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Daily Activity Summary</h4>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily volume for Vendor Inward (Rolls), QC Checking (Lots), and Grey Delivery (Batches)</span>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyProduction} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar name="Vendor Inward (Rolls)" dataKey="Vendor" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar name="QC Checking (Lots)" dataKey="Checking" fill="#eab308" radius={[4, 4, 0, 0]} />
              <Bar name="Grey Delivery (Batches)" dataKey="GreyDelivery" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Production vs Dispatch Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Production vs Dispatch</h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Comparison of total produced fabric vs dispatched volumes (Meters)</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={prodVsDispatch} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Production" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Dispatch" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Process Pending Bottlenecks Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Process Pending (Bottlenecks)</h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Number of lots/orders currently queued per process step</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottlenecks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="process" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {bottlenecks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pending > 30 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Buyer-wise Qty Chart */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Buyer-wise Quantity</h4>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total quantity ordered per buyer (Meters)</span>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buyerQty} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-primary)', fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} cursor={{fill: 'var(--bg-hover)'}}/>
              <Bar dataKey="qty" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
