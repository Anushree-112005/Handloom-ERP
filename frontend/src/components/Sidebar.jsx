import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PieChart, Users, ShoppingCart, Package, Truck, Scissors,
  Factory, CheckSquare, Box, FileText, ClipboardList, Receipt,
  MapPin, Shield, Activity, Layers, ArrowRightLeft, Palette, Info, Settings,
  Lock, Wrench, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight, Edit, Globe,
  ShoppingBag, Database, Briefcase, FileDigit, FolderKanban,
  CreditCard, DollarSign, Target, Percent, BookOpen, Building, Hash, Sparkles, Plus,
  Award, RefreshCw, Clock3, FolderOpen, Calendar, AlertTriangle, LayoutGrid, Menu,
  Clock, TrendingUp, TrendingDown, Grid, Bell, ArrowRight, Map as MapIcon, Eye
} from 'lucide-react';
import { companySettingAPI } from '../services/api';
import defaultLogo from '../assets/logo.svg';


const modules = [
  { section: 'Dashboard' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/overview', label: 'Overview', icon: PieChart },


  { section: 'Masters' },
  { path: '/party-master', label: 'Party Master', icon: Users },

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
      // { path: '/buyer-order/processing', label: 'Order Processing', icon: Layers },
      // { path: '/buyer-order/dispatch-expense', label: 'Dispatch & Expense', icon: Truck },
      // { path: '/ipo-invoice', label: 'IPO Invoice', icon: Receipt }
    ]
  },
  // {
  //   label: 'Work Order Transaction',
  //   icon: Layers,
  //   children: [
  //     { path: '/work-order/transaction/design', label: 'Design & Development', icon: FileText },
  //     { path: '/work-order/transaction/management', label: 'Order Management', icon: Factory },
  //     { path: '/work-order/transaction/processing', label: 'Processing', icon: Palette },
  //     { path: '/work-order/transaction/prep', label: 'Yarn & Fabric Prep', icon: Layers },
  //     { path: '/work-order/transaction/amendments', label: 'Amendments & Codes', icon: Edit }
  //   ]
  // },
  // {
  //   label: 'Work Order Completion',
  //   icon: CheckSquare,
  //   children: [
  //     { path: '/work-order/completion/vendor-purchase', label: 'Vendor & Purchase Completion', icon: ShoppingCart },
  //     { path: '/work-order/completion/processing-fabric', label: 'Processing & Fabric Completion', icon: Layers }
  //   ]
  // },
  // {
  //   label: 'Work Order Approval',
  //   icon: Settings,
  //   children: [
  //     { path: '/work-order/approval/external', label: 'External Order Approvals', icon: Globe },
  //     { path: '/work-order/approval/material-yarn', label: 'Material & Yarn Approvals', icon: Package }
  //   ]
  // },

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

  // { section: 'Warping & Weaving' },
  // {
  //   label: 'Warping/Sizing Transaction',
  //   icon: Settings,
  //   children: [
  //     { path: '/warp/transaction/entries', label: 'Beam & Transaction Entries', icon: Layers },
  //     { path: '/warp/transaction/reports', label: 'Reports, Bills & Amendments', icon: ClipboardList }
  //   ]
  // },

  // { section: 'Greige Transaction' },
  // {
  //   label: 'Greige Transactions',
  //   icon: Layers,
  //   children: [
  //     { path: '/greige/transaction/operations', label: 'Greige Operations', icon: Factory },
  //     { path: '/greige/transaction/administration', label: 'Greige Administration', icon: ClipboardList }
  //   ]
  // },

  // { section: 'Processing / Production' },
  // {
  //   label: 'Fabric Production Desk',
  //   icon: Scissors,
  //   children: [
  //     { path: '/fabric/transaction/checking', label: 'Fabric Checking', icon: CheckSquare },
  //     { path: '/fabric/transaction/inward', label: 'Fabric Inward', icon: Factory },
  //     { path: '/fabric/transaction/delivery', label: 'Fabric Delivery', icon: Truck },
  //     { path: '/fabric/transaction/lotbale', label: 'Lot & Bale', icon: ShoppingBag },
  //     { path: '/fabric/transaction/gate', label: 'Gate & Dispatch', icon: Globe },
  //     { path: '/fabric/transaction/bills', label: 'Vendor Bills', icon: FileText },
  //     { path: '/fabric/transaction/surplus', label: 'Surplus Stock', icon: Database }
  //   ]
  // },

  // Production Planning Modules
  { section: 'Production Planning (PPC)' },
  {
    label: 'Master Setup',
    icon: Settings,
    children: [
      { path: '/ppc/master/loom-master', label: 'Loom Master', icon: Factory },
      { path: '/ppc/master/shift-master', label: 'Shift Master', icon: Clock },
      { path: '/ppc/master/operator-master', label: 'Operator Master', icon: Users },
      { path: '/ppc/master/downtime-reason', label: 'Downtime Reason', icon: AlertTriangle }
    ]
  },
  {
    label: 'Loom Planning',
    icon: Layers,
    children: [
      { path: '/ppc/planning/availability', label: 'Availability Check', icon: Calendar },
      { path: '/ppc/planning/capacity', label: 'Capacity Calc', icon: Activity },
      { path: '/ppc/planning/order-breakdown', label: 'Order Breakdown', icon: PieChart },
      { path: '/ppc/planning/load-balancing', label: 'Load Balancing', icon: Target },
      { path: '/ppc/planning/allocation', label: 'Loom Allocation', icon: CheckSquare }
    ]
  },
  {
    label: 'Production Scheduling',
    icon: Calendar,
    children: [
      { path: '/ppc/scheduling/start-end', label: 'Date Planning', icon: Calendar },
      { path: '/ppc/scheduling/runtime', label: 'Runtime Calc', icon: Clock },
      { path: '/ppc/scheduling/shift-planning', label: 'Shift Planning', icon: Layers },
      { path: '/ppc/scheduling/operator-assign', label: 'Operator Assign', icon: Users },
      { path: '/ppc/scheduling/priority', label: 'Priority Schedule', icon: AlertTriangle }
    ]
  },
  {
    label: 'Production Execution',
    icon: Activity,
    children: [
      { path: '/ppc/execution/loom-start', label: 'Loom Start Entry', icon: Factory },
      { path: '/ppc/execution/shift-entry', label: 'Shift Prod. Entry', icon: ClipboardList },
      { path: '/ppc/execution/iot-entry', label: 'IoT / Auto Entry', icon: Activity },
      { path: '/ppc/execution/speed-monitoring', label: 'Speed Monitoring', icon: TrendingUp },
      { path: '/ppc/execution/status-update', label: 'Status Update', icon: RefreshCw }
    ]
  },
  {
    label: 'Daily Monitoring',
    icon: Eye,
    children: [
      { path: '/ppc/monitoring/daily-report', label: 'Daily Prod. Report', icon: FileText },
      { path: '/ppc/monitoring/target-actual', label: 'Target vs Actual', icon: Target },
      { path: '/ppc/monitoring/efficiency', label: 'Efficiency Calc', icon: TrendingUp },
      { path: '/ppc/monitoring/loss-analysis', label: 'Loss Analysis', icon: TrendingDown },
      { path: '/ppc/monitoring/shift-summary', label: 'Shift Summary', icon: PieChart }
    ]
  },
  {
    label: 'Progress Tracking',
    icon: TrendingUp,
    children: [
      { path: '/ppc/tracking/order-progress', label: 'Order Progress', icon: Layers },
      { path: '/ppc/tracking/loom-contribution', label: 'Loom Contribution', icon: PieChart },
      { path: '/ppc/tracking/live-dashboard', label: 'Live Dashboard', icon: Activity },
      { path: '/ppc/tracking/multi-loom', label: 'Multi-loom View', icon: Grid }
    ]
  },
  {
    label: 'Problem Handling',
    icon: AlertTriangle,
    children: [
      { path: '/ppc/problem/breakdown-entry', label: 'Breakdown Entry', icon: AlertTriangle },
      { path: '/ppc/problem/downtime-calc', label: 'Downtime Calc', icon: Clock },
      { path: '/ppc/problem/lost-meters', label: 'Lost Meters Calc', icon: TrendingDown },
      { path: '/ppc/problem/reallocation', label: 'Reallocation Engine', icon: RefreshCw },
      { path: '/ppc/problem/maintenance', label: 'Maintenance Log', icon: Wrench }
    ]
  },
  {
    label: 'Finish Prediction (ETA)',
    icon: Clock,
    children: [
      { path: '/ppc/prediction/eta-calc', label: 'ETA Calculation', icon: Clock },
      { path: '/ppc/prediction/dynamic-eta', label: 'Dynamic ETA Update', icon: RefreshCw }
    ]
  },
  {
    label: 'Alert & Notification',
    icon: Bell,
    children: [
      { path: '/ppc/alerts/low-efficiency', label: 'Low Efficiency Alert', icon: TrendingDown },
      { path: '/ppc/alerts/breakdown-alert', label: 'Breakdown Alert', icon: AlertTriangle },
      { path: '/ppc/alerts/next-order', label: 'Next Order Alert', icon: ArrowRight }
    ]
  },
  {
    label: 'Reports',
    icon: PieChart,
    children: [
      { path: '/ppc/reports/loom-wise', label: 'Loom-wise Prod.', icon: FileText },
      { path: '/ppc/reports/order-wise', label: 'Order-wise Prod.', icon: Layers },
      { path: '/ppc/reports/daily-factory', label: 'Daily Factory', icon: Activity },
      { path: '/ppc/reports/efficiency-trend', label: 'Efficiency Trend', icon: TrendingUp },
      { path: '/ppc/reports/downtime-history', label: 'Downtime History', icon: Clock },
      { path: '/ppc/reports/delivery-forecast', label: 'Delivery Forecast', icon: MapIcon }
    ]
  },

  { section: 'Quality Control' },
  { path: '/cloth/checking', label: 'On-Table Checking', icon: CheckSquare },

  { section: 'Inventory & Warehouse' },
  { path: '/packing', label: 'Packing Slip', icon: Box },

  // { section: 'Maintenance & Spares' },
  // {
  //   label: 'Maintenance & Spares Desk',
  //   icon: Wrench,
  //   children: [
  //     { path: '/spares/desk/master-setup', label: 'Master Setup', icon: Settings },
  //     { path: '/spares/desk/requests-approvals', label: 'Requests & Approvals', icon: FolderKanban },
  //     { path: '/spares/desk/purchase-work-orders', label: 'Purchase & Work Orders', icon: ShoppingBag },
  //     { path: '/spares/desk/consumption-jobwork', label: 'Consumption & Jobwork', icon: Factory }
  //   ]
  // },
  // { path: '/spares/report', label: 'Spares Report', icon: FileText },

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
      { path: '/cubebook/reports/cash-book', label: 'Cash Book', icon: DollarSign },
      { path: '/cubebook/reports/bank-book', label: 'Bank Book', icon: Building },
      { path: '/cubebook/reports/outstanding', label: 'Outstanding', icon: Percent },
      { path: '/cubebook/reports/sales-register', label: 'Sales Register', icon: Receipt },
      { path: '/cubebook/reports/purchase-register', label: 'Purchase Register', icon: ShoppingCart },
      { path: '/cubebook/reports/ratio-analysis', label: 'Ratio Analysis', icon: PieChart },

      { section: 'GST' },
      { path: '/cubebook/gst', label: 'GST Dashboard', icon: ClipboardList },
      { path: '/cubebook/gst/gstr1', label: 'GSTR-1', icon: ClipboardList },
      { path: '/cubebook/gst/gstr3b', label: 'GSTR-3B', icon: ClipboardList },
      { path: '/cubebook/gst/itc', label: 'Input Tax Credit', icon: ClipboardList },

      { section: 'INVENTORY' },
      { path: '/cubebook/inventory/stock-summary', label: 'Stock Summary', icon: Box },
      { path: '/cubebook/inventory/movement', label: 'Stock Movement', icon: ArrowRightLeft },
      { path: '/cubebook/inventory/godowns', label: 'Godown Summary', icon: MapPin },

      { section: 'BANKING' },
      { path: '/cubebook/banking', label: 'Banking Overview', icon: CreditCard },
      { path: '/cubebook/banking/cheque-register', label: 'Cheque Register', icon: FileText },
      { path: '/cubebook/banking/activities', label: 'Bank Reconcile', icon: CheckSquare },

      { section: 'PAYROLL' },
      { path: '/cubebook/payroll/employees', label: 'Employee Master', icon: Users },
      { path: '/cubebook/payroll/processing', label: 'Salary Processing', icon: DollarSign },
      { path: '/cubebook/payroll/reports', label: 'Payroll Reports', icon: FileText },

      { section: 'ADMINISTRATION' },
      { path: '/cubebook/companies', label: 'Company Master', icon: Building },
      { path: '/cubebook/company-setup', label: 'Company Settings', icon: Settings },
      { path: '/cubebook/admin/users', label: 'User Management', icon: Users },
      { path: '/cubebook/admin/roles', label: 'Roles & Permissions', icon: Shield },
      { path: '/cubebook/currency', label: 'Currency Master', icon: Globe },

      { section: 'AUDIT' },
      { path: '/cubebook/audit', label: 'Audit Log', icon: Activity },
      { path: '/cubebook/audit/vouchers', label: 'Voucher History', icon: ClipboardList },
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
  // {
  //   label: 'Account Transaction',
  //   icon: Briefcase,
  //   children: [
  //     { path: '/accounts/voucher-entry', label: 'Voucher Entry', icon: FileDigit },
  //     { path: '/accounts/transaction', label: 'Accounts Details', icon: FolderKanban },
  //     { path: '/finance/desk/bills', label: 'Creditors Bills', icon: Receipt },
  //     { path: '/finance/desk/invoices', label: 'Sales Invoices', icon: FileText },
  //     { path: '/finance/desk/amendments', label: 'Sales Amendments', icon: Edit },
  //     { path: '/finance/desk/lc', label: 'LC Entries', icon: Globe }
  //   ]
  // },

  { section: 'Vehicle Management' },
  {
    label: 'Vehicle Management',
    icon: LayoutGrid,
    children: [
      { path: '/fleet/dashboard', label: 'Dashboard' },
      { path: '/fleet/vehicles', label: 'Vehicles' },
      { path: '/fleet/drivers', label: 'Vehicle Assignment' },
      { path: '/fleet/service-schedule', label: 'Service Schedule' },
      { path: '/fleet/breakdown-entry', label: 'Breakdown Entry' },
      { path: '/fleet/maintenance-log', label: 'Maintenance Log' },
      { path: '/fleet/documents', label: 'RC / Insurance / Permit' },
      { path: '/fleet/expiry-alerts', label: 'Expiry Alerts' },
      { path: '/fleet/fuel-consumption', label: 'Fuel Consumption Report' },
      { path: '/fleet/driver-performance', label: 'Driver Report' }
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
      { path: '/stores-consumables/item', label: 'Item Master', icon: Box },
      { path: '/stores-consumables/vendor', label: 'Vendor Master', icon: Users },
      { path: '/stores-consumables/department', label: 'Department Master', icon: Building },

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
      { path: '/stores-consumables/physical', label: 'Physical Verification', icon: CheckSquare },
      { path: '/stores-consumables/swatch-cards', label: 'Swatch Cards', icon: Palette },
      { path: '/stores-consumables/fabric-inspection', label: 'Fabric Inspection Book', icon: CheckSquare },
      { path: '/stores-consumables/returnable-dc', label: 'Returnable DC', icon: FileText },


      { section: 'APPROVALS' },
      { path: '/stores-consumables/approve-request', label: 'Request Approval', icon: Shield },
      { path: '/stores-consumables/approve-po', label: 'PO Approval', icon: Shield },
      { path: '/stores-consumables/approve-issue', label: 'Issue Approval', icon: Shield },

      { section: 'REPORTS & ANALYTICS' },
      { path: '/stores-consumables/report-stock', label: 'Stock Inventory', icon: PieChart },
      { path: '/stores-consumables/report-ledger', label: 'Stock Ledger', icon: FileText },
      { path: '/stores-consumables/report-consumption', label: 'Consumption Analysis', icon: PieChart },
      { path: '/stores-consumables/report-purchase', label: 'Purchase Analysis', icon: Receipt },
      { path: '/stores-consumables/report-reorder', label: 'Low Stock Alerts', icon: AlertTriangle },
      { path: '/stores-consumables/report-audit', label: 'Audit Trail', icon: ClipboardList }
    ]
  },


  { section: 'Reports & MIS' },
  { path: '/reports-dashboard', label: 'Reports Dashboard', icon: FileText },
  { path: '/log-report', label: 'Log Report', icon: Activity },

  { section: 'Administration & Security' },
  { path: '/user-management', label: 'User Management', icon: Users },

  { section: 'System' },
  { path: '/company-settings', label: 'Company', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

export default function Sidebar({ isCollapsed, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});
  const [companyProfile, setCompanyProfile] = useState({
    company_name: 'DINESH EXPORTS',
    description: 'THE HOUSE OF FABRICS',
    logo: ''
  });

  // Sidebar menus will only toggle open/close when clicked.


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
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} id="main-sidebar">
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '16px' : '16px 20px' }}>
        {!isCollapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <h1 style={{ fontSize: companyProfile.company_name.length > 15 ? '13px' : '15px', margin: 0, fontWeight: 700 }}>{companyProfile.company_name}</h1>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{companyProfile.description}</span>
              </div>
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
          ) : item.children ? (
            item.label === 'Vehicle Management' ? (
              <div key={item.label} className="nav-group">
                <button
                  className={`nav-item ${openMenus[item.label] ? 'open' : ''}`}
                  onClick={() => {
                    toggleMenu(item.label);
                    navigate('/fleet/dashboard');
                  }}
                  style={{
                    width: 'calc(100% - 16px)',
                    margin: '4px 8px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: '600',
                    color: '#1E293B'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <item.icon style={{ width: 18, height: 18, color: '#7C3AED' }} />
                    <span>{item.label}</span>
                  </div>
                  {openMenus[item.label] ? <ChevronDown size={16} style={{ color: '#64748b' }} /> : <ChevronRight size={16} style={{ color: '#64748b' }} />}
                </button>
                {openMenus[item.label] && (
                  <div
                    className="nav-children animate-fade"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      marginLeft: '24px',
                      borderLeft: '1.5px solid #E2E8F0',
                      paddingLeft: '12px',
                      marginTop: '6px',
                      marginBottom: '10px',
                      gap: '4px'
                    }}
                  >
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        end={child.path === '/'}
                        className={({ isActive }) =>
                          `vehicle-sub-item ${isActive ? 'active' : ''}`
                        }
                      >
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
                          key={child.path}
                          to={child.path}
                          end={child.path === '/'}
                          className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                          }
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
            )
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
