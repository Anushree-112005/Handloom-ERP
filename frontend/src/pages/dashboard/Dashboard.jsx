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
  const [dateFilter, setDateFilter] = useState('All Time');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Operations and Charts State
  const [operations, setOperations] = useState([]);
  
  const [dailyProduction, setDailyProduction] = useState([]);
  const [prodVsDispatch, setProdVsDispatch] = useState([]);
  const [bottleneckData, setBottleneckData] = useState([]);
  const [buyerQty, setBuyerQty] = useState([]);
  const [qualityCompliance, setQualityCompliance] = useState([]);
  const [dispatchByTransporter, setDispatchByTransporter] = useState([]);

  // Dropdown UI state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const fetchDashboardStats = () => {
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
    const params = {};
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    dashboardAPI.stats(params)
      .then((r) => {
        if (r.data) {
          setStats(r.data);
        }
      })
      .catch((err) => console.error("Error fetching dashboard stats:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    if (!stats) return;

    const vendorInward = stats?.vendor_inward_rolls ?? 0;
    const purchaseInward = stats?.purchase_inward_kgs ?? 0;
    const processDelivery = stats?.process_delivery_batches ?? 0;
    const processInward = stats?.process_inward_bags ?? 0;
    const salesDelivery = stats?.sales_delivery ?? 0;
    const impoVal = stats?.impo_orders ?? 0;
    const imboVal = stats?.imbo_lots ?? 0;
    const totalDC = stats?.total_dc_challans ?? 0;
    const totalQty = stats?.total_qty_meters ?? 0;

    // 1. Update Daily Operations Panel with real data
    setOperations([
      { label: 'Vendor Inward', value: `${vendorInward} Rolls`, path: '/cloth/inward', color: '#10b981', icon: Factory },
      { label: 'Purchase Inward', value: `${purchaseInward.toLocaleString()} Kgs`, path: '/yarn/inward', color: '#22c55e', icon: Layers },
      { label: 'Process Delivery', value: `${processDelivery} Batches`, path: '/yarn/grey-delivery', color: '#64748b', icon: Clock },
      { label: 'Process Inward', value: `${processInward} Bags`, path: '/dyed-yarn/received', color: '#ec4899', icon: Layers },
      { label: 'Sales Delivery', value: `${salesDelivery} Deliveries`, path: '/despatch', color: '#3b82f6', icon: MapPin },
      { label: 'IMPO', value: `${impoVal} Orders`, path: '/yarn/inward', color: '#ea580c', icon: ShoppingCart },
      { label: 'IMBO', value: `${imboVal} Lots`, path: '/cloth/inward', color: '#a855f7', icon: Package },
      { label: 'Total DC', value: `${totalDC} Challans`, path: '/despatch', color: '#06b6d4', icon: Receipt },
      { label: 'Total Qty', value: `${totalQty.toLocaleString()} Mtrs`, path: '/sales-invoice', color: '#10b981', icon: BarChart3 }
    ]);

    // 2. Update Charts with real data
    setDailyProduction(stats?.daily_production || []);
    setProdVsDispatch(stats?.production_vs_dispatch || []);
    setBottleneckData(stats?.process_bottlenecks || []);
    setBuyerQty(stats?.buyer_order_volumes || []);
    setQualityCompliance(stats?.quality_compliance || []);
    setDispatchByTransporter(stats?.dispatch_by_transporter || []);
  }, [stats]);

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
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              background: 'var(--bg-primary)',
              border: `1px solid var(--border)`,
              borderLeft: `3.5px solid ${item.color}`,
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 2px 6px ${item.color}15`;
              e.currentTarget.style.borderColor = `${item.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ 
              color: item.color, 
              background: `${item.color}14`, 
              padding: '6px', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <item.icon size={16} strokeWidth={2.5} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {item.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 1 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
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
    <div className="card" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <div style={{ marginBottom: 4, textAlign: 'center', flexShrink: 0 }}>
        <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 750, color: 'var(--text-primary)' }}>{title}</h4>
        {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>}
      </div>
      <div style={{ flex: 1, height: '100%', minHeight: 0, width: '100%' }}>
        {children}
      </div>
    </div>
  );

  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
        {payload.map((entry, index) => (
          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 3, fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: entry.color, marginRight: 6 }}></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)', gap: 8, boxSizing: 'border-box' }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>Textile Operations Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0 0' }}>Live overview of yarn, production, and dispatch metrics.</p>
        </div>
        
        <div className="card dashboard-filter-bar" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row', width: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={15} />
            <span style={{ fontSize: 13, fontWeight: 650 }}>Filter:</span>
          </div>
          
          <select className="form-control" style={{ width: 125, padding: '4px 8px', fontSize: 12.5, fontWeight: 500, height: 30 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="All Time">All Time</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
            <option value="Custom Range">Custom Range</option>
          </select>

          {dateFilter === 'Custom Range' && (
            <>
              <input type="date" className="form-control" style={{ width: 115, padding: '4px', fontSize: 12, height: 30 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>to</span>
              <input type="date" className="form-control" style={{ width: 115, padding: '4px', fontSize: 12, height: 30 }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </>
          )}

          <div style={{ position: 'relative', borderLeft: '1px solid var(--border)', paddingLeft: 10, display: 'inline-block' }}>
            <button className="btn btn-primary" onClick={() => setExportDropdownOpen(!exportDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', fontSize: 12.5, fontWeight: 600, height: 30, cursor: 'pointer' }}>
              <Download size={14} /><span>Export</span>
            </button>
            {exportDropdownOpen && (
              <>
                <div onClick={() => setExportDropdownOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: 'var(--shadow-md)', zIndex: 999, minWidth: 140 }}>
                  <button onClick={() => { setExportDropdownOpen(false); exportToPDF(); }} style={{ padding: '8px 12px', fontSize: 12, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>Download as PDF</button>
                  <button onClick={() => { setExportDropdownOpen(false); exportToExcel(); }} style={{ padding: '8px 12px', fontSize: 12, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>Download as Excel</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {renderMetricGrid('A. Daily Operations Panel', operations)}
      </div>

      {/* Row 1: 3 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1, minHeight: 0 }}>
        <ChartCard title="Production vs Dispatch by Month" subtitle="Volume in Meters">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prodVsDispatch} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Production" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="Dispatch" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Process Chart" subtitle="Pending Lots/Orders">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bottleneckData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                {bottleneckData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend content={renderCustomLegend} verticalAlign="middle" align="right" layout="vertical" />
              <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 15, fontWeight: 'bold', fill: 'var(--text-primary)' }}>
                {bottleneckData.reduce((acc, curr) => acc + curr.value, 0)}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Buyer Order Volumes" subtitle="Total Meters Ordered">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={buyerQty} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, flex: 1, minHeight: 0 }}>
        <ChartCard title="Quality Compliance %" subtitle="Pass rate per process step">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={qualityCompliance} layout="vertical" margin={{ top: 5, right: 15, left: 0, bottom: 0 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} width={65} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#0284c7" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Dispatch by Transporter" subtitle="Volume distributed (Meters)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dispatchByTransporter} layout="vertical" margin={{ top: 5, right: 15, left: 0, bottom: 0 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} width={65} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Dispatch Target vs Actual" subtitle="Last 4 Weeks Analysis">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prodVsDispatch.slice(-4)} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Dispatch" name="Actual" fill="#38bdf8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Production" name="Target" fill="#94a3b8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
