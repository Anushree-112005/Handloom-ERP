import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette, Info
} from 'lucide-react';

const modules = [
  { section: 'Dashboard' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/overview', label: 'Overview', icon: PieChart },

  { section: 'Masters' },
  { path: '/party-master', label: 'Party Master', icon: Users },

  { section: 'Design Management' },
  { path: '/design-entry', label: 'Design Entry', icon: Palette },

  { section: 'Order Management' },
  { path: '/buyer-order', label: 'Buyer Order', icon: ShoppingCart },

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
  { path: '/employee', label: 'Employee Master', icon: Shield },
  { path: '/user-management', label: 'User Management', icon: Users },

  { section: 'System' },
  { path: '/about', label: 'About', icon: Info },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-brand">
        <div className="logo-icon">DT</div>
        <div>
          <h1>Dinesh Textile</h1>
          <span>ERP System</span>
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
