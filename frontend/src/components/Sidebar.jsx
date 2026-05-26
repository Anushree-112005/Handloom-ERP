import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette
} from 'lucide-react';

const modules = [
  { section: 'Dashboards' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/overview', label: 'Process Flow Overview', icon: PieChart },

  { section: 'Masters' },
  { path: '/party-master', label: 'Party Master', icon: Users },
  { path: '/employee', label: 'Employee Master', icon: Shield },

  { section: 'Orders' },
  { path: '/buyer-order', label: 'Buyer Order', icon: ShoppingCart },
  { path: '/despatch', label: 'Despatch Planning', icon: MapPin },

  { section: 'Yarn Management' },
  { path: '/yarn/purchase-order', label: 'Yarn Purchase Order', icon: Package },
  { path: '/yarn/inward', label: 'Yarn Inward', icon: ArrowRightLeft },
  { path: '/yarn/grey-delivery', label: 'Grey Yarn Delivery', icon: Truck },

  { section: 'Dyed Yarn' },
  { path: '/dyed-yarn/received', label: 'Dyed Yarn Received', icon: Palette },
  { path: '/dyed-yarn/delivery', label: 'Dyed Yarn Delivery', icon: Truck },

  { section: 'Warping & Weaving' },
  { path: '/warp/beam-receipt', label: 'Warp Beam Receipt', icon: Layers },
  { path: '/warp/delivery', label: 'Warp Delivery', icon: Truck },

  { section: 'Cloth & Processing' },
  { path: '/cloth/inward', label: 'Cloth Inward', icon: Factory },
  { path: '/cloth/checking', label: 'On-Table Checking', icon: CheckSquare },
  { path: '/cloth/delivery', label: 'Cloth Delivery', icon: Truck },

  { section: 'Sales & Dispatch' },
  { path: '/finished-fabric', label: 'Finished Fabric', icon: Scissors },
  { path: '/packing', label: 'Packing Slip', icon: Box },
  { path: '/goods-release', label: 'Goods Release (GRA)', icon: ClipboardList },
  { path: '/sales-invoice', label: 'Sales Invoice', icon: Receipt },
  { path: '/eway-bill', label: 'E-Way Bill', icon: FileText },

  { section: 'Reports' },
  { path: '/log-report', label: 'Log Report', icon: Activity },
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
