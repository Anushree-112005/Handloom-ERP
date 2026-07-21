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

// Base Mock Data (Templates) tailored for Textile ERP
const getPastDateLabel = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

const baseDailyProductionData = [];
const baseProdVsDispatchData = [];
const baseBottleneckData = [];
const baseBuyerQtyData = [];
const baseQualityCompliance = [];
const baseDispatchByTransporter = [];


const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#38bdf8', '#7dd3fc', '#bae6fd'];

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
  
  const [dailyProduction, setDailyProduction] = useState(baseDailyProductionData);
  const [prodVsDispatch, setProdVsDispatch] = useState(baseProdVsDispatchData);
  const [bottleneckData, setBottleneckData] = useState(baseBottleneckData);
  const [buyerQty, setBuyerQty] = useState(baseBuyerQtyData);
  const [qualityCompliance, setQualityCompliance] = useState(baseQualityCompliance);
  const [dispatchByTransporter, setDispatchByTransporter] = useState(baseDispatchByTransporter);

  // Dropdown UI state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  useEffect(() => {
    dashboardAPI.stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = () => {
    let factor = 1.0;
    if (dateFilter === 'This Week') factor = 0.45;
    else if (dateFilter === 'This Year') factor = 8.5;
    else if (dateFilter === 'Custom Range') factor = 0.7;

    let start_date = '';
    let end_date = '';
    const today = new Date();

    if (dateFilter === 'This Week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      start_date = monday.toISOString().split('T')[0];
      end_date = new Date().toISOString().split('T')[0];
    } else if (dateFilter === 'This Month') {
      const y = today.getFullYear();
      const m = today.getMonth();
      start_date = new Date(y, m, 1).toISOString().split('T')[0];
      end_date = new Date(y, m + 1, 0).toISOString().split('T')[0];
    } else if (dateFilter === 'This Year') {
      const y = today.getFullYear();
      start_date = `${y}-01-01`;
      end_date = `${y}-12-31`;
    } else if (dateFilter === 'Custom Range') {
      start_date = fromDate;
      end_date = toDate;
    }

    setLoading(true);
    dashboardAPI.stats({ start_date, end_date })
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    let factor = 1.0;
    if (dateFilter === 'This Week') factor = 0.45;
    else if (dateFilter === 'This Year') factor = 8.5;
    else if (dateFilter === 'Custom Range') factor = 0.7;

    const vendorInward = stats?.vendor_inward_rolls ?? 0;
    const purchaseInward = stats?.purchase_inward_kgs ?? 0;
    const processDelivery = stats?.process_delivery_batches ?? 0;
    const processInward = stats?.process_inward_bags ?? 0;
    const salesDelivery = stats?.sales_delivery ?? 0;
    const impoVal = stats?.impo_orders ?? 0;
    const imboVal = stats?.imbo_lots ?? 0;
    const totalDC = stats?.total_dc_challans ?? 0;
    const totalQty = stats?.total_qty_meters ?? 0;

    // 1. Update Daily Operations Panel
    setOperations([
      { label: 'Vendor Inward', value: `${Math.round(vendorInward * factor)} Rolls`, path: '/cloth/inward', color: '#10b981', icon: Factory },
      { label: 'Purchase Inward', value: `${Math.round(purchaseInward * factor).toLocaleString()} Kgs`, path: '/yarn/inward', color: '#22c55e', icon: Layers },
      { label: 'Process Delivery', value: `${Math.round(processDelivery * factor)} Batches`, path: '/yarn/grey-delivery', color: '#64748b', icon: Clock },
      { label: 'Process Inward', value: `${Math.round(processInward * factor)} Bags`, path: '/dyed-yarn/received', color: '#ec4899', icon: Layers },
      { label: 'Sales Delivery', value: `${Math.round(salesDelivery * factor)} Deliveries`, path: '/despatch', color: '#3b82f6', icon: MapPin },
      { label: 'IMPO', value: `${Math.round(impoVal * factor)} Orders`, path: '/yarn/inward', color: '#ea580c', icon: ShoppingCart },
      { label: 'IMBO', value: `${Math.round(imboVal * factor)} Lots`, path: '/cloth/inward', color: '#a855f7', icon: Package },
      { label: 'Total DC', value: `${Math.round(totalDC * factor)} Challans`, path: '/despatch', color: '#06b6d4', icon: Receipt },
      { label: 'Total Qty', value: `${Math.round(totalQty * factor).toLocaleString()} Mtrs`, path: '/sales-invoice', color: '#10b981', icon: BarChart3 }
    ]);

    // 2. Update Charts
    if (stats?.daily_production) {
      setDailyProduction(stats.daily_production.map(d => ({ ...d, Vendor: Math.round(d.Vendor * factor), Checking: Math.round(d.Checking * factor), GreyDelivery: Math.round(d.GreyDelivery * factor) })));
    } else {
      setDailyProduction(baseDailyProductionData.map(d => ({ ...d, Vendor: Math.round(d.Vendor * factor), Checking: Math.round(d.Checking * factor), GreyDelivery: Math.round(d.GreyDelivery * factor) })));
    }

    if (stats?.production_vs_dispatch) {
      setProdVsDispatch(stats.production_vs_dispatch.map(d => ({ ...d, Production: Math.round(d.Production * factor), Dispatch: Math.round(d.Dispatch * factor) })));
    } else {
      setProdVsDispatch(baseProdVsDispatchData.map(d => ({ ...d, Production: Math.round(d.Production * factor), Dispatch: Math.round(d.Dispatch * factor) })));
    }

    if (stats?.process_bottlenecks) {
      setBottleneckData(stats.process_bottlenecks.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    } else {
      setBottleneckData(baseBottleneckData.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    }

    if (stats?.buyer_order_volumes) {
      setBuyerQty(stats.buyer_order_volumes.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    } else {
      setBuyerQty(baseBuyerQtyData.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    }

    if (stats?.quality_compliance) {
      setQualityCompliance(stats.quality_compliance.map(d => ({ ...d, value: Math.min(100, Math.round(d.value * (factor > 1 ? 1 : factor))) })));
    } else {
      setQualityCompliance(baseQualityCompliance.map(d => ({ ...d, value: Math.min(100, Math.round(d.value * (factor > 1 ? 1 : factor))) })));
    }

    if (stats?.dispatch_by_transporter) {
      setDispatchByTransporter(stats.dispatch_by_transporter.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    } else {
      setDispatchByTransporter(baseDispatchByTransporter.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    }


    // 2. Update Charts
    if (stats?.daily_production) {
      setDailyProduction(stats.daily_production.map(d => ({ ...d, Vendor: Math.round(d.Vendor * factor), Checking: Math.round(d.Checking * factor), GreyDelivery: Math.round(d.GreyDelivery * factor) })));
    } else {
      setDailyProduction(baseDailyProductionData.map(d => ({ ...d, Vendor: Math.round(d.Vendor * factor), Checking: Math.round(d.Checking * factor), GreyDelivery: Math.round(d.GreyDelivery * factor) })));
    }

    if (stats?.production_vs_dispatch) {
      setProdVsDispatch(stats.production_vs_dispatch.map(d => ({ ...d, Production: Math.round(d.Production * factor), Dispatch: Math.round(d.Dispatch * factor) })));
    } else {
      setProdVsDispatch(baseProdVsDispatchData.map(d => ({ ...d, Production: Math.round(d.Production * factor), Dispatch: Math.round(d.Dispatch * factor) })));
    }

    if (stats?.process_bottlenecks) {
      setBottleneckData(stats.process_bottlenecks.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    } else {
      setBottleneckData(baseBottleneckData.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    }

    if (stats?.buyer_order_volumes) {
      setBuyerQty(stats.buyer_order_volumes.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    } else {
      setBuyerQty(baseBuyerQtyData.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    }

    if (stats?.quality_compliance) {
      setQualityCompliance(stats.quality_compliance.map(d => ({ ...d, value: Math.min(100, Math.round(d.value * (factor > 1 ? 1 : factor))) })));
    } else {
      setQualityCompliance(baseQualityCompliance.map(d => ({ ...d, value: Math.min(100, Math.round(d.value * (factor > 1 ? 1 : factor))) })));
    }

    if (stats?.dispatch_by_transporter) {
      setDispatchByTransporter(stats.dispatch_by_transporter.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    } else {
      setDispatchByTransporter(baseDispatchByTransporter.map(d => ({ ...d, value: Math.round(d.value * factor) })));
    }
  }, [stats, dateFilter]);

  const exportToExcel = () => {
    setExportDropdownOpen(false);
    const data = operations.map(op => ({ Metric: op.label, Value: op.value }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Operations");
    XLSX.writeFile(wb, `Dashboard_${dateFilter.replace(/\s+/g, '_')}.xlsx`);
  };

  const exportToPDF = () => {
    setExportDropdownOpen(false);
    const doc = new jsPDF();
    doc.text(`Dashboard Operations Report (${dateFilter})`, 14, 15);
    const tableData = operations.map(op => [op.label, op.value]);
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: tableData,
      startY: 20,
    });
    doc.save(`Dashboard_${dateFilter.replace(/\s+/g, '_')}.pdf`);
  };

  const renderMetricGrid = (title, items) => (
    <div style={{ marginBottom: 20 }}>
      {/* Compact Grid Layout for clear dashboard visibility */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              background: 'var(--bg-primary)',
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${item.color}`,
              borderRadius: '8px',
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 8px ${item.color}15`;
              e.currentTarget.style.borderColor = `${item.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ 
              color: item.color, 
              background: `${item.color}15`, 
              padding: '8px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <item.icon size={18} strokeWidth={2.5} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {item.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 750, color: 'var(--text-primary)' }}>
                  {item.value.split(' ')[0]} 
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {item.value.split(' ').slice(1).join(' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children }) => (
    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
        {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>}
      </div>
      <div style={{ flex: 1, minHeight: 220 }}>
        {children}
      </div>
    </div>
  );

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
        {payload.map((entry, index) => (
          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color, marginRight: 8 }}></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Textile Operations Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Live overview of yarn, production, and dispatch metrics.</p>
        </div>
        
        <div className="card dashboard-filter-bar" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row', width: 'auto', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>
          
          <select className="form-control" style={{ width: 140, padding: '8px 12px' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
            <option value="Custom Range">Custom Range</option>
          </select>

          {dateFilter === 'Custom Range' && (
            <>
              <input type="date" className="form-control" style={{ width: 130, padding: '8px' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input type="date" className="form-control" style={{ width: 130, padding: '8px' }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </>
          )}

          <div style={{ position: 'relative', borderLeft: '1.5px solid var(--border)', paddingLeft: 16, display: 'inline-block' }}>
            <button className="btn btn-primary" onClick={() => setExportDropdownOpen(!exportDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, height: 38, cursor: 'pointer' }}>
              <Download size={15} /><span>Export</span>
            </button>
            {exportDropdownOpen && (
              <>
                <div onClick={() => setExportDropdownOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: 'var(--bg-primary)', border: '1.5px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 999, minWidth: 160 }}>
                  <button onClick={() => { setExportDropdownOpen(false); exportToPDF(); }} style={{ padding: '10px 16px', fontSize: 12, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>Download as PDF</button>
                  <button onClick={() => { setExportDropdownOpen(false); exportToExcel(); }} style={{ padding: '10px 16px', fontSize: 12, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>Download as Excel</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {renderMetricGrid('A. Daily Operations Panel', operations)}

      {/* Row 1: 3 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Production vs Dispatch by Month" subtitle="Volume in Meters">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prodVsDispatch} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Production" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Dispatch" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Process Chart" subtitle="Pending Lots/Orders">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bottleneckData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                {bottleneckData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend content={renderCustomLegend} verticalAlign="middle" align="right" layout="vertical" />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 'bold', fill: 'var(--text-primary)' }}>
                {bottleneckData.reduce((acc, curr) => acc + curr.value, 0)}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Buyer Order Volumes" subtitle="Total Meters Ordered">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={buyerQty} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                {buyerQty.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend content={renderCustomLegend} verticalAlign="middle" align="right" layout="vertical" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: 3 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Quality Compliance %" subtitle="Pass rate per process step">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={qualityCompliance} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#0284c7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Dispatch by Transporter" subtitle="Volume distributed (Meters)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dispatchByTransporter} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 5 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Dispatch Target vs Actual" subtitle="Last 4 Weeks Analysis">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prodVsDispatch.slice(-4)} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Dispatch" name="Actual Dispatch" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Production" name="Target Dispatch" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      {/* Row 3: 1 Full-width Column (Daily Activity) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <ChartCard title="Daily Factory Activity" subtitle="Past 7 days overview of inward and output processes">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyProduction} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Vendor" name="Vendor Inward (Rolls)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Checking" name="QC Checking (Lots)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="GreyDelivery" name="Grey Delivery (Batches)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

    </div>
  );
}
