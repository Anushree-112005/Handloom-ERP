import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette, Info, Settings,
  Lock, Wrench, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight
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
  { path: '/work-order/transaction', label: 'Work Order Transaction', icon: Layers },
  { path: '/work-order/completion', label: 'Work Order Completion', icon: CheckSquare },
  { path: '/work-order/approval', label: 'Work Order Approval', icon: Settings },

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
  { path: '/warp/transaction', label: 'Sizing & Warping Desk', icon: Settings },

  { section: 'Greige Transaction' },
  { path: '/greige/transaction', label: 'Greige Transactions', icon: Layers },

  { section: 'Processing / Production' },
  { path: '/cloth/inward', label: 'Cloth Inward', icon: Factory },
  { path: '/cloth/delivery', label: 'Cloth Delivery', icon: Truck },
  { path: '/finished-fabric', label: 'Finished Fabric', icon: Scissors },
  { path: '/fabric/transaction', label: 'Fabric Transactions', icon: Scissors },

  { section: 'LAB & Shade Management' },


  { section: 'Quality Control' },
  { path: '/cloth/checking', label: 'On-Table Checking', icon: CheckSquare },

  { section: 'Inventory & Warehouse' },
  { path: '/packing', label: 'Packing Slip', icon: Box },

  { section: 'Maintenance & Spares' },
  { path: '/spares/master', label: 'Spares Masters', icon: Settings },
  { path: '/spares/transaction', label: 'Spares Transactions', icon: Wrench },
  { path: '/spares/approval', label: 'Spares Approvals', icon: CheckSquare },
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
  { path: '/accounts/voucher-entry', label: 'Voucher Entry', icon: Receipt },
  { path: '/accounts/transaction', label: 'Accounts Transaction', icon: ArrowRightLeft },

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
