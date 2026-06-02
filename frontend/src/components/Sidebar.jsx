import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette, Info, Settings,
  Lock, Wrench, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight, Edit, Globe,
  ShoppingBag, Database, Briefcase, FileDigit, FolderKanban
} from 'lucide-react';
import { companySettingAPI } from '../services/api';
import defaultLogo from '../assets/logo.svg';


const modules = [
  { section: 'Dashboard' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/overview', label: 'Overview', icon: PieChart },

  { section: 'Masters' },
  { path: '/party-master', label: 'Party Master', icon: Users },
  { path: '/employee', label: 'Employee Master', icon: Shield },


  { section: 'Order Management' },
  {
    label: 'Buyer Order',
    icon: ShoppingCart,
    children: [
      { path: '/buyer-order', label: 'Buyer Order Form', icon: ShoppingCart },
      { path: '/buyer-order/processing', label: 'Order Processing', icon: Layers },
      { path: '/buyer-order/dispatch-expense', label: 'Dispatch & Expense', icon: Truck },
      { path: '/ipo-invoice', label: 'IPO Invoice', icon: Receipt }
    ]
  },
  {
    label: 'Work Order Transaction',
    icon: Layers,
    children: [
      { path: '/work-order/transaction/design', label: 'Design & Development', icon: FileText },
      { path: '/work-order/transaction/management', label: 'Order Management', icon: Factory },
      { path: '/work-order/transaction/processing', label: 'Processing', icon: Palette },
      { path: '/work-order/transaction/prep', label: 'Yarn & Fabric Prep', icon: Layers },
      { path: '/work-order/transaction/amendments', label: 'Amendments & Codes', icon: Edit }
    ]
  },
  {
    label: 'Work Order Completion',
    icon: CheckSquare,
    children: [
      { path: '/work-order/completion/vendor-purchase', label: 'Vendor & Purchase Completion', icon: ShoppingCart },
      { path: '/work-order/completion/processing-fabric', label: 'Processing & Fabric Completion', icon: Layers }
    ]
  },
  {
    label: 'Work Order Approval',
    icon: Settings,
    children: [
      { path: '/work-order/approval/external', label: 'External Order Approvals', icon: Globe },
      { path: '/work-order/approval/material-yarn', label: 'Material & Yarn Approvals', icon: Package }
    ]
  },

  { section: 'Design Management' },
  { path: '/design-entry', label: 'Design Entry', icon: Palette },

  { section: 'Purchase Management' },
  { path: '/yarn/purchase-order', label: 'Yarn Purchase Order', icon: Package },

  { section: 'Yarn Management' },
  { path: '/yarn/inward', label: 'Yarn Inward', icon: ArrowRightLeft },
  { path: '/yarn/grey-delivery', label: 'Grey Yarn Delivery', icon: Truck },
  { path: '/dyed-yarn/received', label: 'Dyed Yarn Received', icon: Palette },
  { path: '/dyed-yarn/delivery', label: 'Dyed Yarn Delivery', icon: Truck },

  { section: 'Warping & Weaving' },
  { path: '/warp/beam-receipt', label: 'Warp Beam Received Entry', icon: Layers },
  { path: '/warp/delivery', label: 'Warp Beam Delivery Entry', icon: Truck },
  {
    label: 'Warping/Sizing Transaction',
    icon: Settings,
    children: [
      { path: '/warp/transaction/entries', label: 'Beam & Transaction Entries', icon: Layers },
      { path: '/warp/transaction/reports', label: 'Reports, Bills & Amendments', icon: ClipboardList }
    ]
  },

  { section: 'Greige Transaction' },
  {
    label: 'Greige Transactions',
    icon: Layers,
    children: [
      { path: '/greige/transaction/operations', label: 'Greige Operations', icon: Factory },
      { path: '/greige/transaction/administration', label: 'Greige Administration', icon: ClipboardList }
    ]
  },

  { section: 'Processing / Production' },
  {
    label: 'Fabric Production Desk',
    icon: Scissors,
    children: [
      { path: '/fabric/transaction/checking', label: 'Fabric Checking', icon: CheckSquare },
      { path: '/fabric/transaction/inward', label: 'Fabric Inward', icon: Factory },
      { path: '/fabric/transaction/delivery', label: 'Fabric Delivery', icon: Truck },
      { path: '/fabric/transaction/lotbale', label: 'Lot & Bale', icon: ShoppingBag },
      { path: '/fabric/transaction/gate', label: 'Gate & Dispatch', icon: Globe },
      { path: '/fabric/transaction/bills', label: 'Vendor Bills', icon: FileText },
      { path: '/fabric/transaction/surplus', label: 'Surplus Stock', icon: Database }
    ]
  },

  { section: 'LAB & Shade Management' },


  { section: 'Quality Control' },
  { path: '/cloth/checking', label: 'On-Table Checking', icon: CheckSquare },

  { section: 'Inventory & Warehouse' },
  { path: '/packing', label: 'Packing Slip', icon: Box },

  { section: 'Maintenance & Spares' },
  {
    label: 'Maintenance & Spares Desk',
    icon: Wrench,
    children: [
      { path: '/spares/desk/master-setup', label: 'Master Setup', icon: Settings },
      { path: '/spares/desk/requests-approvals', label: 'Requests & Approvals', icon: FolderKanban },
      { path: '/spares/desk/purchase-work-orders', label: 'Purchase & Work Orders', icon: ShoppingBag },
      { path: '/spares/desk/consumption-jobwork', label: 'Consumption & Jobwork', icon: Factory }
    ]
  },
  { path: '/spares/report', label: 'Spares Report', icon: FileText },

  { section: 'Gate & Security' },
  { path: '/gate/inward', label: 'Gate Inward', icon: ArrowDownLeft },
  { path: '/gate/outward', label: 'Gate Outward', icon: ArrowUpRight },
  { path: '/gate/pass', label: 'Gate Pass Creation', icon: FileText },
  { path: '/gate/reports', label: 'Gate Reports', icon: PieChart },

  { section: 'Sales & Dispatch' },
  { path: '/goods-release', label: 'Goods Release (GRA)', icon: ClipboardList },
  { path: '/sales-invoice', label: 'Sales Invoice', icon: Receipt },
  { path: '/despatch', label: 'Despatch Planning', icon: MapPin },

  { section: 'Export & Logistics' },
  { path: '/eway-bill', label: 'E-Way Bill', icon: FileText },

  { section: 'Accounts & Finance' },
  {
    label: 'Account Transaction',
    icon: Briefcase,
    children: [
      { path: '/finance/desk/bills', label: 'Bills & Approvals', icon: Receipt },
      { path: '/finance/desk/invoices', label: 'Sales Invoices', icon: FileDigit },
      { path: '/finance/desk/amendments', label: 'Sales Amendments', icon: Edit },
      { path: '/finance/desk/lc', label: 'LC Management', icon: Briefcase }
    ]
  },
  { path: '/accounts/voucher-entry', label: 'Voucher Entry', icon: Receipt },
  // { path: '/accounts/transaction', label: 'Accounts Transaction', icon: ArrowRightLeft },

  { section: 'Reports & MIS' },
  { path: '/reports-dashboard', label: 'Reports Dashboard', icon: FileText },
  { path: '/log-report', label: 'Log Report', icon: Activity },

  { section: 'Administration & Security' },
  { path: '/user-management', label: 'User Management', icon: Users },

  { section: 'System' },
  { path: '/company-settings', label: 'Company', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

export default function Sidebar() {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [companyProfile, setCompanyProfile] = useState({
    company_name: 'DINESH EXPORTS',
    description: 'THE HOUSE OF FABRICS',
    logo: ''
  });

  // Auto-expand menu if active route is a child
  useEffect(() => {
    modules.forEach(mod => {
      if (mod.children) {
        const isActiveChild = mod.children.some(child => location.pathname.startsWith(child.path));
        if (isActiveChild) {
          setOpenMenus(prev => ({ ...prev, [mod.label]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const response = await companySettingAPI.get();
        if (response.data) {
          setCompanyProfile({
            company_name: response.data.company_name || 'DINESH EXPORTS',
            description: response.data.description || 'THE HOUSE OF FABRICS',
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
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-brand">
        {companyProfile.logo ? (
          <div className="logo-icon" style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 2 }}>
            <img src={companyProfile.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div className="logo-icon" style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 2 }}>
            <img src={defaultLogo} alt="Default Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: companyProfile.company_name.length > 15 ? '13px' : '15px' }}>{companyProfile.company_name}</h1>
          <span>{companyProfile.description}</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {modules.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : item.children ? (
            <div key={item.label} className="nav-group">
              <button
                className={`nav-item ${openMenus[item.label] ? 'open' : ''}`}
                onClick={() => toggleMenu(item.label)}
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
                  {item.children.map(child => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={child.path === '/'}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                      }
                      style={{ padding: '8px 16px 8px 48px', fontSize: '13px', margin: '1px 8px' }}
                    >
                      <child.icon style={{ width: 14, height: 14 }} />
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
