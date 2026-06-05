import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette, Info, Settings,
  Lock, Wrench, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight, Edit, Globe,
  ShoppingBag, Database, Briefcase, FileDigit, FolderKanban,
  CreditCard, DollarSign, Target, Percent, BookOpen, Building, Hash
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
  
  { section: 'Sub Masters' },
  {
    label: 'Core System Basics',
    icon: Package,
    children: [
      { path: '/sub-master/buyer', label: 'Buyer Master', icon: Users },
      { path: '/sub-master/certified_type', label: 'Certified Type', icon: Shield },
      { path: '/sub-master/color_master', label: 'Color Master', icon: Palette },
      { path: '/sub-master/count_system', label: 'Count System', icon: Layers },
      { path: '/sub-master/currency_master', label: 'Currency Master', icon: Receipt },
      { path: '/sub-master/designer', label: 'Designer Master', icon: Palette },
      { path: '/sub-master/district_city_master', label: 'District & City', icon: MapPin },
      { path: '/sub-master/end_use_master', label: 'End Use Master', icon: Target },
      { path: '/sub-master/gate_location_master', label: 'Gate Location', icon: MapPin },
      { path: '/sub-master/godown_master', label: 'Godown Master', icon: Box },
      { path: '/sub-master/group_count', label: 'Group Count', icon: Layers },
      { path: '/sub-master/hsn_code_master', label: 'HSN Code Master', icon: FileText },
      { path: '/sub-master/loom_master', label: 'Loom Master', icon: Factory },
      { path: '/sub-master/loom_type_master', label: 'Loom Type Master', icon: Factory },
      { path: '/sub-master/lr_terms', label: 'LR Terms', icon: FileText },
      { path: '/sub-master/lr_type_master', label: 'LR Type Master', icon: Truck },
      { path: '/sub-master/organization_name_master', label: 'Organization Name Master', icon: Building },
      { path: '/sub-master/manager', label: 'Manager Master', icon: Users },
      { path: '/sub-master/merchandiser', label: 'Merchandiser Master', icon: Users },
      { path: '/sub-master/mill_name_master', label: 'Mill Name Master', icon: Factory },
      { path: '/sub-master/order_type_master', label: 'Order Type Master', icon: ClipboardList },
      { path: '/sub-master/packing_type_master', label: 'Packing Type Master', icon: Box },
      { path: '/sub-master/party_group', label: 'Party Group', icon: Users },
      { path: '/sub-master/party_type', label: 'Party Type', icon: Users },
      { path: '/sub-master/party_type_group', label: 'Party Type / Group', icon: Users },
      { path: '/sub-master/pattern_master', label: 'Pattern Master', icon: Layers },
      { path: '/sub-master/payment_terms_master', label: 'Payment Terms', icon: Receipt },
      { path: '/sub-master/payment_term_and_conditions', label: 'Payment Term & Conditions', icon: Receipt },
      { path: '/sub-master/sales_region_master', label: 'Sales Region', icon: MapPin },
      { path: '/sub-master/section_group', label: 'Section Group', icon: Layers },
      { path: '/sub-master/sp_no', label: 'SP NO Master', icon: Layers },
      { path: '/sub-master/uom_master', label: 'Unit Master', icon: Layers },
      { path: '/sub-master/transport_mode_master', label: 'Transport Mode Master', icon: Truck },
      { path: '/sub-master/transport_name_master', label: 'Transport Name Master', icon: Truck },
      { path: '/sub-master/yarn_count_master', label: 'Yarn Count Master', icon: Layers },
      { path: '/sub-master/yarn_type_master', label: 'Yarn Type Master', icon: Layers },
    ],
  },
  {
    label: 'Operations & Processing',
    icon: Wrench,
    children: [
      { path: '/sub-master/ac_incharge', label: 'A/C Incharge', icon: Users },
      { path: '/sub-master/against_reference_master', label: 'Against Reference Master', icon: ClipboardList },
      { path: '/sub-master/category_master', label: 'Category Master', icon: Layers },
      { path: '/sub-master/freight_type_master', label: 'Freight Type Master', icon: Truck },
      { path: '/sub-master/checker_name_master', label: 'Checker Name', icon: CheckSquare },
      { path: '/sub-master/checking_table_machine', label: 'Checking Table/Machine', icon: Settings },
      { path: '/sub-master/chemical_group_master', label: 'Chemical Group', icon: Layers },
      { path: '/sub-master/cloth_dyeing_order_process_type', label: 'Cloth Dyeing Order Process Type', icon: Settings },
      { path: '/sub-master/damage_master', label: 'Damage Master', icon: Shield },
      { path: '/sub-master/debit_credit_reason_master', label: 'Debit/Credit Reason', icon: FileText },
      { path: '/sub-master/design_color_master', label: 'Design Color', icon: Palette },
      { path: '/sub-master/dyeing_cly', label: 'Dyeing Cly', icon: Layers },
      { path: '/sub-master/duty_master', label: 'Duty Master', icon: Receipt },
      { path: '/sub-master/expenses_group', label: 'Expenses Group', icon: Receipt },
      { path: '/sub-master/expenses_group_head', label: 'Expenses Group/Head', icon: Receipt },
      { path: '/sub-master/expense_type_master', label: 'Expense Type Master', icon: Receipt },
      { path: '/sub-master/payment_mode_master', label: 'Payment Mode Master', icon: CreditCard },
      { path: '/sub-master/fabric_type_master', label: 'Fabric Master', icon: Scissors },
      { path: '/sub-master/fibre_count_master', label: 'Fibre Count', icon: Layers },
      { path: '/sub-master/finishing_type_master', label: 'Finishing Type', icon: Wrench },
      { path: '/sub-master/grey_checker_name', label: 'Grey Checker Name', icon: CheckSquare },
      { path: '/sub-master/grey_damage', label: 'Grey Damage Master', icon: Shield },
      { path: '/sub-master/gry_mas_baletype', label: 'Gry Mas BaleType', icon: Box },
      { path: '/sub-master/printing_technique_master', label: 'Printing Technique', icon: Palette },
      { path: '/sub-master/process_sequence_master', label: 'Process Sequences', icon: ClipboardList },
      { path: '/sub-master/process_type_master', label: 'Process Type Master', icon: Settings },
      { path: '/sub-master/remarks_master', label: 'Remarks Master', icon: FileText },
      { path: '/sub-master/sample', label: 'Sample Master', icon: ClipboardList },
      { path: '/sub-master/shringage', label: 'Shringage (Shrinkage)', icon: Wrench },
      { path: '/sub-master/sizing_chemical_master', label: 'Sizing Chemical', icon: Layers },
      { path: '/sub-master/tds_bill_type_master', label: 'TDS Bill Type', icon: FileText },
      { path: '/sub-master/test_parameter_master', label: 'Test Parameter', icon: Activity },
      { path: '/sub-master/weaving_type_master', label: 'Weaving Master', icon: Layers },
    ],
  },
  {
    label: 'Complex Masters',
    icon: Layers,
    children: [
      { path: '/sub-master/buyer_kyc_form', label: 'Buyer KYC Form', icon: Shield },
      { path: '/sub-master/buyer_sub_master', label: 'Buyer Sub Master', icon: Users },
      { path: '/sub-master/company_bank_master', label: 'Company Bank Master', icon: CreditCard },
      { path: '/sub-master/fabric_costing_engine', label: 'Fabric Costing Engine', icon: DollarSign },
      { path: '/sub-master/fabric_single_costing', label: 'Fabric Single Costing', icon: DollarSign },
      { path: '/sub-master/lc_bank_master', label: 'LC Bank Master', icon: Factory },
    ],
  },
  {
    label: 'Amendment Masters',
    icon: ClipboardList,
    children: [
      { path: '/sub-master/cloth_lot_no_amd', label: 'Cloth LOT No. AMD', icon: ClipboardList },
      { path: '/sub-master/invoice_amd', label: 'Invoice AMD', icon: FileText },
      { path: '/sub-master/despatch_request_amd', label: 'Despatch Request AMD', icon: Truck },
      { path: '/sub-master/point_amd', label: 'Point AMD', icon: Target },
      { path: '/sub-master/vendor_order_amd', label: 'Vendor Order AMD', icon: ShoppingCart },
    ],
  },
  {
    label: 'System Config & Utilities',
    icon: Settings,
    children: [
      { path: '/sub-master/approval_settings', label: 'Approval Settings', icon: Settings },
      { path: '/sub-master/direct_invoice_limits', label: 'Direct Invoice Limits', icon: Percent },
      { path: '/sub-master/sub_menu_master', label: 'Sub Menu Master', icon: ClipboardList },
      { path: '/sub-master/control_service', label: 'Control Service', icon: Shield },
      { path: '/sub-master/log_report_util', label: 'Log Report', icon: FileText },
      { path: '/sub-master/old_year_menu', label: 'Old Year Menu', icon: BookOpen },
    ],
  },


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
  { path: '/design-ai', label: 'Design AI', icon: Sparkles },

  { section: 'Purchase Management' },
  { path: '/yarn/purchase-order', label: 'Yarn Purchase Order', icon: Package },

  { section: 'Yarn Management' },
  { path: '/yarn/inward', label: 'Yarn Inward', icon: ArrowRightLeft },
  { path: '/yarn/grey-delivery', label: 'Grey Yarn Delivery', icon: Truck },
  { path: '/dyed-yarn/received', label: 'Dyed Yarn Received', icon: Palette },
  { path: '/dyed-yarn/delivery', label: 'Dyed Yarn Delivery', icon: Truck },

  { section: 'Warping & Weaving' },
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

  // Auto-expand menu if active route is a child (excluding sub-master modules to prevent vertical menu overflow)
  useEffect(() => {
    modules.forEach(mod => {
      if (mod.children) {
        const isActiveChild = mod.children.some(child => 
          location.pathname.startsWith(child.path) && !child.path.startsWith('/sub-master/')
        );
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
