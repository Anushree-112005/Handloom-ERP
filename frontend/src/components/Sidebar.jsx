import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette, Info, Settings
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
  { path: '/buyer-order', label: 'Buyer Order', icon: ShoppingCart },

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
  { path: '/warp/beam-receipt', label: 'Warp Beam Receipt', icon: Layers },
  { path: '/warp/delivery', label: 'Warp Delivery', icon: Truck },

  { section: 'Processing / Production' },
  { path: '/cloth/inward', label: 'Cloth Inward', icon: Factory },
  { path: '/cloth/delivery', label: 'Cloth Delivery', icon: Truck },
  { path: '/finished-fabric', label: 'Finished Fabric', icon: Scissors },

  { section: 'LAB & Shade Management' },


  { section: 'Quality Control' },
  { path: '/cloth/checking', label: 'On-Table Checking', icon: CheckSquare },

  { section: 'Inventory & Warehouse' },
  { path: '/packing', label: 'Packing Slip', icon: Box },

  { section: 'Sales & Dispatch' },
  { path: '/goods-release', label: 'Goods Release (GRA)', icon: ClipboardList },
  { path: '/sales-invoice', label: 'Sales Invoice', icon: Receipt },
  { path: '/despatch', label: 'Despatch Planning', icon: MapPin },

  { section: 'Export & Logistics' },
  { path: '/eway-bill', label: 'E-Way Bill', icon: FileText },

  { section: 'Accounts & Finance' },

  { section: 'Reports & MIS' },
  { path: '/log-report', label: 'Log Report', icon: Activity },

  { section: 'Administration & Security' },
  { path: '/user-management', label: 'User Management', icon: Users },

  { section: 'System' },
  { path: '/company-settings', label: 'Company', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

export default function Sidebar() {
  const location = useLocation();
  const [companyProfile, setCompanyProfile] = useState({
    company_name: 'DINESH EXPORTS',
    description: 'THE HOUSE OF FABRICS',
    logo: ''
  });

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
