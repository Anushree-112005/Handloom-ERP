import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Calculator, LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette, Info, Settings,
  Lock, Wrench, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight, Edit, Globe,
  ShoppingBag, Database, Briefcase, FileDigit, FolderKanban,
  CreditCard, DollarSign, Target, Percent, BookOpen, Building, Hash, Sparkles, Plus,
  Award, RefreshCw, Clock3, FolderOpen, Calendar, AlertTriangle, LayoutGrid, Menu,
  Clock, TrendingUp, TrendingDown, Grid, Bell, ArrowRight, Map as MapIcon, Eye,
  Brain, PlayCircle, BarChart2, Printer, BarChart3, ImageIcon
} from 'lucide-react';
import { companySettingAPI } from '../services/api';
import defaultLogo from '../assets/logo.svg';


const jobWorkRoutes = [
  { section: 'Yarn Dyeing' },
  { path: '/dyed-yarn/delivery', label: 'Yarn Dyeing Delivery', icon: Truck },
  { path: '/dyed-yarn/received', label: 'Yarn Dyeing Receipt', icon: Palette },

  { section: 'Warping & Sizing' },
  { path: '/warp/delivery', label: 'Warping & Sizing Delivery', icon: Truck },
  { path: '/warp/beam-receipt', label: 'Warping & Sizing Receipt', icon: Box },
  { path: '/warp/production-entry', label: 'Warping Production Entry', icon: Factory },
  { path: '/warp/sizing-production-entry', label: 'Sizing Production Entry', icon: Settings },

  { section: 'Weaving' },
  { path: '/weaving/delivery', label: 'Weaving Delivery', icon: Truck },
  { path: '/cloth/inward', label: 'Weaving Receipt', icon: ArrowDownLeft },

  { section: 'Fabric Dyeing' },
  { path: '/jobwork/fabric-dyeing-delivery', label: 'Fabric Dyeing Delivery', icon: Truck },
  { path: '/jobwork/dyed-fabric-receipt', label: 'Fabric Dyeing Receipt', icon: Palette },

  { section: 'Finishing' },
  { path: '/jobwork/finishing-delivery', label: 'Finishing Delivery', icon: Truck },
  { path: '/jobwork/finished-fabric-receipt', label: 'Finishing Receipt', icon: Box },

  { section: 'Job Work Services' },
  // { path: '/jobwork/bill', label: 'Job Work Bill Entry', icon: FileText },
  { path: '/jobwork/status', label: 'Job Work Status', icon: Activity },
];

const modules = [
  { section: 'Dashboard' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/overview', label: 'Overview', icon: PieChart },
  { path: '/calendar', label: 'Calendar', icon: Calendar },

  { section: 'Textile Operations' },
  {
    label: 'Textile Operations Management',
    icon: Factory,
    children: [
      { section: 'Masters' },
      { path: '/party-master', label: 'Party Master', icon: Users },

      { section: 'Order Management' },
      { path: '/buyer-order', label: 'Buyer Order Form', icon: ShoppingCart },
      { path: '/buyer-order/processing', label: 'Buyer Order Schedule', icon: Calendar },
      { path: '/ipo-invoice', label: 'Proforma Invoice', icon: FileText },
      { path: '/work-order/transaction/amendments', label: 'Buyer Order Amendment', icon: Edit },
      { path: '/buyer-order/completion', label: 'Buyer Order Completion', icon: CheckSquare },
      { path: '/buyer-order/dispatch-expense', label: 'Order Expenses', icon: DollarSign },

      { section: 'Design Management' },
      { path: '/design-entry', label: 'Design Entry', icon: Palette },

      { section: 'Purchase Management' },
      { path: '/yarn/purchase-order', label: 'Grey / Color Yarn PO', icon: Box },
      { path: '/purchase-order/yarn-dyeing', label: 'Yarn Dyeing PO', icon: Palette },
      { path: '/purchase-order/twisting-doubling', label: 'Twisting / Doubling PO', icon: Layers },
      { path: '/purchase-order/warping-sizing', label: 'Warping / Sizing PO', icon: Factory },
      { path: '/purchase-order/weaving', label: 'Weaving PO', icon: Layers },
      { path: '/purchase-order/fabric-dyeing', label: 'Fabric Dyeing PO', icon: Palette },
      { path: '/purchase-order/processing', label: 'Processing PO', icon: Scissors },
      { path: '/purchase-order/cloth', label: 'Cloth Purchase PO', icon: Package },

      { section: 'JOB WORK MANAGEMENT' },
      ...jobWorkRoutes,

      { section: 'Approval' },
      { path: '/work-order/approval/buyer-order', label: 'Buyer Order Approval', icon: ClipboardList },
      { path: '/work-order/approval/pi', label: 'PI Approval', icon: FileText },
      { path: '/work-order/approval/vendor-workorder', label: 'Vendor Workorder Approval', icon: ShoppingCart },
      { path: '/work-order/approval/internal-fabric', label: 'Internal Fabric Request Approval', icon: Package },
      { path: '/dc-approval/gra', label: 'GRA Approval', icon: ClipboardList },
      { path: '/dc-approval/surplus', label: 'Surplus DC Approval', icon: FileText },
      { section: 'Quality Control' },
      { path: '/cloth/checking', label: 'Grey Inspection', icon: CheckSquare },
      { path: '/fabric/transaction/checking', label: 'Final Inspection', icon: CheckSquare },

      { section: 'Inventory' },
      { path: '/yarn/inward', label: 'Yarn Inward', icon: ArrowRightLeft },
      { path: '/yarn/stock', label: 'Yarn Stock', icon: Box },
      { path: '/warehouse-stock', label: 'Warehouse Stock Photos', icon: Box },
      { path: '/inventory/stock-summary', label: 'Stock Summary', icon: PieChart },
      { path: '/inventory/stock-ledger', label: 'Stock Ledger', icon: FileText },
      { path: '/inventory/stock-sheet', label: 'Stock Sheet', icon: FileText },

      { section: 'Packing' },
      { path: '/packing', label: 'Packing Slip', icon: Box },

      { section: 'Sales & Dispatch' },
      { path: '/goods-release', label: 'Goods Release (GRA)', icon: ClipboardList },
      { path: '/sales-invoice', label: 'Sales Invoice', icon: Receipt },
      { path: '/eway-bill', label: 'E-Way Bill', icon: FileText },
      { path: '/despatch', label: 'Despatch ', icon: MapPin },

      { section: 'Gate & Security' },
      { path: '/gate/inward', label: 'Gate Inward', icon: ArrowDownLeft },
      { path: '/gate/outward', label: 'Gate Outward', icon: ArrowUpRight },
      { path: '/gate/pass', label: 'Gate Pass Creation', icon: FileText },
      { path: '/gate/reports', label: 'Gate Reports', icon: PieChart },

      { section: 'Reports & MIS' },
      { path: '/reports-dashboard', label: 'Reports', icon: FileText }
    ]
  },



  { section: 'Accounts & Finance' },
  {
    label: 'Finance',
    icon: Briefcase,
    children: [
      { section: 'HOME' },
      { path: '/cubebook/dashboard', label: 'Dashboard', icon: LayoutDashboard },

      { section: 'MASTERS' },
      { path: '/cubebook/masters', label: 'Create', icon: Plus },
      { path: '/cubebook/masters/alter', label: 'Alter', icon: Edit },
      { path: '/cubebook/masters/chart', label: 'Chart of Accounts', icon: BookOpen },


      { section: 'TRANSACTIONS' },
      { path: '/cubebook/vouchers', label: 'Vouchers', icon: Receipt },
      { path: '/cubebook/day-book', label: 'Day Book', icon: ClipboardList },

      { section: 'REPORTS' },
      { path: '/cubebook/reports/trial-balance', label: 'Trial Balance', icon: FileText },
      { path: '/cubebook/reports/profit-loss', label: 'Profit & Loss', icon: DollarSign },
      { path: '/cubebook/reports/balance-sheet', label: 'Balance Sheet', icon: Layers },
      { path: '/cubebook/reports/ledger', label: 'Ledger Report', icon: FileText },
      // { path: '/cubebook/reports/cash-book', label: 'Cash Book', icon: DollarSign },
      { path: '/cubebook/reports/bank-book', label: 'Bank Book', icon: Building },
      { path: '/cubebook/reports/outstanding', label: 'Outstanding', icon: Percent },
      { path: '/cubebook/reports/sales-register', label: 'Sales Register', icon: Receipt },
      // { path: '/cubebook/reports/purchase-register', label: 'Purchase Register', icon: ShoppingCart },
      { path: '/cubebook/reports/ratio-analysis', label: 'Ratio Analysis', icon: PieChart },

      // { section: 'GST' },
      // { path: '/cubebook/gst', label: 'GST Dashboard', icon: ClipboardList },
      // { path: '/cubebook/gst/gstr1', label: 'GSTR-1', icon: ClipboardList },
      // { path: '/cubebook/gst/gstr3b', label: 'GSTR-3B', icon: ClipboardList },
      // { path: '/cubebook/gst/itc', label: 'Input Tax Credit', icon: ClipboardList },

      // { section: 'INVENTORY' },
      // { path: '/cubebook/inventory/stock-summary', label: 'Stock Summary', icon: Box },
      // { path: '/cubebook/inventory/movement', label: 'Stock Movement', icon: ArrowRightLeft },
      // { path: '/cubebook/inventory/godowns', label: 'Godown Summary', icon: MapPin },

      // { section: 'BANKING' },
      // { path: '/cubebook/banking', label: 'Banking Overview', icon: CreditCard },
      // { path: '/cubebook/banking/cheque-register', label: 'Cheque Register', icon: FileText },
      // { path: '/cubebook/banking/activities', label: 'Bank Reconcile', icon: CheckSquare },

      // { section: 'PAYROLL' },
      // { path: '/cubebook/payroll/employees', label: 'Employee Master', icon: Users },
      // { path: '/cubebook/payroll/processing', label: 'Salary Processing', icon: DollarSign },
      // { path: '/cubebook/payroll/reports', label: 'Payroll Reports', icon: FileText },

      // { section: 'ADMINISTRATION' },
      // { path: '/cubebook/companies', label: 'Company Master', icon: Building },
      // { path: '/cubebook/company-setup', label: 'Company Settings', icon: Settings },
      // { path: '/cubebook/admin/users', label: 'User Management', icon: Users },
      // { path: '/cubebook/admin/roles', label: 'Roles & Permissions', icon: Shield },
      // { path: '/cubebook/currency', label: 'Currency Master', icon: Globe },

      // { section: 'AUDIT' },
      // { path: '/cubebook/audit', label: 'Audit Log', icon: Activity },
      // { path: '/cubebook/audit/vouchers', label: 'Voucher History', icon: ClipboardList },
    ]
  },

  // Status Update Module
  { section: 'Status Update Module' },
  { path: '/status-update/dashboard', label: 'Status Update', icon: Activity },

  // Production Planning Modules
  { section: 'Production Planning (PPC)' },
  {
    label: 'Production Management',
    icon: Factory,
    children: [
      { section: 'OVERVIEW' },
      { path: '/ppc/tracking/live-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      // { path: '/ppc/ai-insights', label: 'AI Insights', icon: Brain },

      { section: 'MODULES' },
      { path: '/ppc/master/loom-master', label: 'Master Setup', icon: Settings },
      { path: '/ppc/planning/availability', label: 'Loom Planning', icon: ClipboardList },
      { path: '/ppc/scheduling/start-end', label: 'Scheduling', icon: Calendar },
      //{ path: '/ppc/execubtion/loom-start', label: 'Execution', icon: PlayCircle },
      { path: '/ppc/monitoring/target-actual', label: 'Daily Monitor', icon: BarChart2 },
      { path: '/costing-sheet', label: 'Costing Sheet', icon: Calculator },
      //{ path: '/ppc/execubtion/loom-start', label: 'Execution', icon: PlayCircle },
      { path: '/ppc/monitoring', label: 'Daily Monitor', icon: BarChart2 },
      { path: '/ppc/tracking/order-progress', label: 'Progress', icon: TrendingUp },
      { path: '/ppc/problem/breakdown-entry', label: 'Problems', icon: Wrench },
      { path: '/ppc/eta-engine', label: 'ETA Engine', icon: Clock },
      { path: '/ppc/alerts/low-efficiency', label: 'Alerts', icon: Bell, badge: '3', badgeColor: '#e11d48' },
      { path: '/ppc/reports/loom-wise', label: 'Reports', icon: FileText }
    ]
  },

  { section: 'Human Resources' },
  {
    label: 'HR Management',
    icon: Users,
    children: [
      { section: 'DASHBOARDS' },
      { path: '/hr', label: 'HR Dashboard', icon: LayoutDashboard },

      { section: 'master' },
      { path: '/hr/departments', label: 'Departments', icon: Building },
      { path: '/hr/designations', label: 'Designations', icon: Award },
      { path: '/hr/shifts', label: 'Shifts', icon: RefreshCw },
      { path: '/hr/holidays', label: 'Holidays', icon: Calendar },
      { path: '/hr/employees', label: 'Employee Master', icon: Shield },


      { section: ' ATTENDANCE' },
      { path: '/hr/attendance', label: 'Attendance & Leave', icon: Calendar },
      { path: '/hr/payroll', label: 'Payroll', icon: FileText },



      { section: 'COMPENSATION' },
      { path: '/hr/loans', label: 'Loans', icon: DollarSign },
      { path: '/hr/benefits', label: 'Benefits', icon: Award },
      { path: '/hr/travel', label: 'Travel Requests', icon: Globe },
      { path: '/hr/expenses', label: 'Expense Claims', icon: DollarSign },

      { section: 'REPORTS' },
      { path: '/hr/reports', label: 'Reports', icon: FileText }
    ]
  },


  { section: 'Vehicle Management' },
  {
    label: 'Vehicle Management',
    icon: LayoutGrid,
    children: [
      { path: '/fleet/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/fleet/vehicles', label: 'Vehicles', icon: Truck },
      { path: '/fleet/drivers', label: 'Vehicle Assignment', icon: Users },
      { path: '/fleet/routes', label: 'Routes', icon: MapIcon },
      { path: '/fleet/trip-planning', label: 'Trip Planning', icon: Calendar },
      { path: '/fleet/service-schedule', label: 'Service Schedule', icon: Calendar },
      { path: '/fleet/breakdown-entry', label: 'Breakdown Entry', icon: AlertTriangle },
      { path: '/fleet/maintenance-log', label: 'Maintenance Log', icon: Wrench },
      { path: '/fleet/documents', label: 'RC / Insurance / Permit', icon: FileText },
      { path: '/fleet/expiry-alerts', label: 'Expiry Alerts', icon: Bell },
      // { path: '/fleet/fuel-entry', label: 'Fuel Entry', icon: Activity },
      { path: '/fleet/fuel-consumption', label: 'Fuel Consumption Report', icon: Activity },
      { path: '/fleet/driver-performance', label: 'Driver Report', icon: Users }
    ]
  },

  { section: 'Stores & Consumables' },
  {
    label: 'Stores & Consumables',
    icon: Package,
    children: [
      { section: 'HOME' },
      { path: '/stores-consumables/dashboard', label: 'Dashboard', icon: LayoutDashboard },

      { section: 'MASTERS' },
      { path: '/stores-consumables/category', label: 'Category Master', icon: Layers },
      { path: '/stores-consumables/uom', label: 'UOM Master', icon: Layers },
      { path: '/stores-consumables/vendor', label: 'Vendor Master', icon: Users },
      { path: '/stores-consumables/department', label: 'Department Master', icon: Building },
      { path: '/stores-consumables/item', label: 'Item Master', icon: Box },

      { section: 'TRANSACTIONS' },
      { path: '/stores-consumables/request', label: 'Department Request', icon: FileText },
      { path: '/stores-consumables/requisition', label: 'Purchase Requisition', icon: ClipboardList },
      { path: '/stores-consumables/quotation', label: 'Vendor Quotation', icon: FileText },
      { path: '/stores-consumables/po', label: 'Purchase Order', icon: ShoppingBag },

      { path: '/stores-consumables/grn', label: 'Stock Inward (GRN)', icon: ArrowRightLeft },
      { path: '/stores-consumables/issue', label: 'Issue to Dept', icon: ArrowUpRight },
      { path: '/stores-consumables/return', label: 'Return to Store', icon: ArrowDownLeft },
      { path: '/stores-consumables/transfer', label: 'Store Transfer', icon: ArrowRightLeft },
      { path: '/stores-consumables/adjustment', label: 'Stock Adjustment', icon: AlertTriangle },
      // { path: '/stores-consumables/physical', label: 'Physical Verification', icon: CheckSquare },
      // { path: '/stores-consumables/swatch-cards', label: 'Swatch Cards', icon: Palette },
      // { path: '/stores-consumables/fabric-inspection', label: 'Fabric Inspection Book', icon: CheckSquare },
      { path: '/stores-consumables/returnable-dc', label: 'Returnable DC', icon: FileText },


      { section: 'REPORTS & ANALYTICS' },
      { path: '/stores-consumables/reports/po-print', label: 'Purchase Order / DC Printing', icon: Printer },
      { path: '/stores-consumables/reports/po-status', label: 'Purchase Order & Request Status', icon: FileText },
      { path: '/stores-consumables/reports/purchase-received', label: 'Purchase & Received Reports', icon: Receipt },
      { path: '/stores-consumables/reports/consumption', label: 'Consumption Reports', icon: BarChart3 },
      { path: '/stores-consumables/reports/stock', label: 'Stock Reports', icon: Layers },

      { section: 'APPROVALS' },
      { path: '/stores-consumables/approve-request', label: 'Request Approval', icon: Shield },
      { path: '/stores-consumables/approve-po', label: 'PO Approval', icon: Shield },
      { path: '/stores-consumables/approve-issue', label: 'Issue Approval', icon: Shield }
    ]
  },




  { section: 'Administration & Security' },
  { path: '/user-management', label: 'User Management', icon: Users },
  { path: '/role-management', label: 'Role & Permission', icon: Shield },
  { path: '/log-report', label: 'Log Report', icon: Activity },


  { section: 'System' },
  { path: '/company-settings', label: 'Company', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];


export default function Sidebar({ isCollapsed, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({ 'Purchase Order': true, 'Textile Operations Management': true });
  const [companyProfile, setCompanyProfile] = useState({
    company_name: 'HANDLOOM ERP',
    description: '',
    logo: ''
  });

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Commented out to prevent the dropdowns (like Finance) from automatically opening on page refresh/load.
  // The submenus will now only open or close when the user explicitly clicks on them.
  /*
  useEffect(() => {
    const activeMenuLabel = modules.find(item => 
      item.children && item.children.some(child => {
        if (!child.path) return false;
        if (child.path.includes('?')) {
          const [pathPart, queryPart] = child.path.split('?');
          return location.pathname === pathPart && location.search.includes(queryPart);
        }
        return location.pathname === child.path;
      })
    )?.label;
    
    if (activeMenuLabel) {
      setOpenMenus(prev => ({ ...prev, [activeMenuLabel]: true }));
    }
  }, [location.pathname, location.search]);
  */

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const response = await companySettingAPI.get();
        if (response.data) {
          setCompanyProfile({
            company_name: response.data.company_name || 'HANDLOOM ERP',
            description: response.data.description || '',
            logo: response.data.logo || ''
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCompany();

    window.addEventListener('company-settings-updated', loadCompany);
    return () => {
      window.removeEventListener('company-settings-updated', loadCompany);
    };
  }, []);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} id="main-sidebar">
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '16px' : '16px 20px' }}>
        {!isCollapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: companyProfile.company_name.length > 15 ? '14px' : '16px', margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>{companyProfile.company_name}</h1>
            </div>
            <button
              onClick={onToggleSidebar}
              className="sidebar-toggle-btn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                borderRadius: '4px',
                marginRight: 0
              }}
              title="Collapse Sidebar"
            >
              <Menu size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggleSidebar}
            className="sidebar-toggle-btn"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              borderRadius: '4px',
              marginRight: 0
            }}
            title="Expand Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
      </div>
      <nav className="sidebar-nav">
        {modules.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : item.isJobWorkDynamic ? (
            <div key={i} className="nav-group">
              <div className="nav-section" style={{ marginTop: '0', paddingBottom: '8px' }}>JOB WORK MANAGEMENT</div>
              {jobWorkRoutes.map((route, rIdx) => (
                <NavLink
                  key={`jw-${rIdx}`}
                  to={route.path}
                  end={route.path === '/'}
                  className={({ isActive }) => {
                    const isReallyActive = route.path.includes('?')
                      ? (location.pathname === route.path.split('?')[0] && location.search.includes(route.path.split('?')[1]))
                      : isActive;
                    return `nav-item ${isReallyActive ? 'active' : ''}`;
                  }}
                >
                  <route.icon />
                  <span style={{ flex: 1 }}>{route.label}</span>
                </NavLink>
              ))}
            </div>
          ) : item.children ? (
            <div key={item.label} className="nav-group">
              <button
                className={`nav-item ${openMenus[item.label] ? 'open' : ''}`}
                onClick={() => {
                  toggleMenu(item.label);
                  if (item.label === 'CubeBook Finance') {
                    navigate('/cubebook/dashboard');
                  } else if (item.label === 'HR Management') {
                    navigate('/hr');
                  } else if (item.label === 'Vehicle Management') {
                    navigate('/fleet/dashboard');
                  } else if (item.label === 'Stores & Consumables') {
                    navigate('/stores-consumables/dashboard');
                  } else if (item.label === 'Production Management') {
                    navigate('/ppc/tracking/live-dashboard');
                  } else if (item.label === 'Inventory Management') {
                    navigate('/inventory/dashboard');
                  } else if (item.label === 'Warehouse Operations') {
                    navigate('/warehouse/dashboard');
                  }
                }}
                style={{ width: 'calc(100% - 16px)', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <item.icon />
                  <span>{item.label}</span>
                </div>
                {openMenus[item.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {openMenus[item.label] && (
                <div className="nav-children animate-fade" style={{ display: 'flex', flexDirection: 'column' }}>
                  {item.children.map((child, childIdx) =>
                    child.section ? (
                      <div
                        key={`sec-${childIdx}`}
                        style={{
                          padding: '16px 16px 6px 32px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em'
                        }}
                      >
                        {child.section}
                      </div>
                    ) : (
                      <NavLink
                        key={`${child.path}-${childIdx}`}
                        to={child.path}
                        end={child.path === '/'}
                        className={({ isActive }) => {
                          const isReallyActive = child.path.includes('?')
                            ? (location.pathname === child.path.split('?')[0] && location.search.includes(child.path.split('?')[1]))
                            : (location.pathname === child.path);
                          return `nav-item ${isReallyActive ? 'active' : ''}`;
                        }}
                        style={{ padding: '10px 16px 10px 24px', fontSize: '13.5px', margin: '2px 8px' }}
                      >
                        <child.icon style={{ width: 16, height: 16 }} />
                        <span>{child.label}</span>
                      </NavLink>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (!item.path || item.path === '#') ? (
            <div
              key={item.label}
              className="nav-item"
              style={{
                cursor: 'default',
                pointerEvents: 'none',
                opacity: 0.85
              }}
            >
              <item.icon />
              <span style={{ flex: 1 }}>{item.label}</span>
            </div>
          ) : (
            <NavLink
              key={`${item.path}-${item.label}`}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => {
                const isReallyActive = item.path.includes('?')
                  ? (location.pathname === item.path.split('?')[0] && location.search.includes(item.path.split('?')[1]))
                  : isActive;
                return `nav-item ${isReallyActive ? 'active' : ''}`;
              }}
            >
              <item.icon />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && !isCollapsed && (
                <span style={{ background: item.badgeColor || '#e11d48', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '12px', minWidth: '18px', textAlign: 'center' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
