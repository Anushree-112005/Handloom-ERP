import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, PlusCircle, FileEdit, Network, Receipt, BookOpen,
  Building2, PieChart, TrendingUp, Package, FileSpreadsheet, Settings,
  ChevronRight, ChevronDown, BarChart3, CreditCard, Warehouse, Scale,
  ArrowLeftRight, FileText, ClipboardList, DollarSign, ShieldCheck,
  UserCheck, BadgePercent, Boxes, BookMarked, Globe, Calculator,
  AlertTriangle, Activity,
} from 'lucide-react';

const NAV = [
  {
    group: 'HOME',
    items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    group: 'MASTERS',
    items: [
      { name: 'Create',           path: '/masters',        icon: PlusCircle },
      { name: 'Alter',            path: '/masters/alter',  icon: FileEdit },
      { name: 'Chart of Accounts',path: '/masters/chart',  icon: Network },
      { name: 'Party Master',     path: '/ledgers',        icon: Users },
    ],
  },
  {
    group: 'TRANSACTIONS',
    items: [
      { name: 'Vouchers',  path: '/vouchers',  icon: Receipt },
      { name: 'Day Book',  path: '/day-book',  icon: BookOpen },
    ],
  },
  {
    group: 'REPORTS',
    items: [
      { name: 'Trial Balance',    path: '/reports/trial-balance',    icon: Scale },
      { name: 'Profit & Loss',    path: '/reports/profit-loss',      icon: TrendingUp },
      { name: 'Balance Sheet',    path: '/reports/balance-sheet',    icon: PieChart },
      { name: 'Ledger Report',    path: '/reports/ledger',           icon: BookMarked },
      { name: 'Cash Book',        path: '/reports/cash-book',        icon: DollarSign },
      { name: 'Bank Book',        path: '/reports/bank-book',        icon: CreditCard },
      { name: 'Outstanding',      path: '/reports/outstanding',      icon: AlertTriangle },
      { name: 'Sales Register',   path: '/reports/sales-register',   icon: ClipboardList },
      { name: 'Purchase Register',path: '/reports/purchase-register',icon: FileText },
      { name: 'Ratio Analysis',   path: '/reports/ratio-analysis',   icon: BarChart3 },
    ],
  },
  {
    group: 'GST',
    items: [
      { name: 'GST Dashboard',    path: '/gst',              icon: BadgePercent },
      { name: 'GSTR-1',           path: '/gst/gstr1',        icon: FileSpreadsheet },
      { name: 'GSTR-3B',          path: '/gst/gstr3b',       icon: FileSpreadsheet },
      { name: 'Input Tax Credit', path: '/gst/itc',          icon: Calculator },
    ],
  },
  {
    group: 'INVENTORY',
    items: [
      { name: 'Stock Summary',    path: '/inventory/stock-summary',  icon: Boxes },
      { name: 'Stock Movement',   path: '/inventory/movement',       icon: Activity },
      { name: 'Godown Summary',   path: '/inventory/godowns',        icon: Warehouse },
    ],
  },
  {
    group: 'BANKING',
    items: [
      { name: 'Banking Overview', path: '/banking',                      icon: Building2 },
      { name: 'Cheque Register',  path: '/banking/cheque-register',      icon: CreditCard },
      { name: 'Bank Reconcile',   path: '/banking/activities',           icon: ArrowLeftRight },
    ],
  },
  {
    group: 'PAYROLL',
    items: [
      { name: 'Employee Master',  path: '/payroll/employees',   icon: UserCheck },
      { name: 'Salary Processing',path: '/payroll/processing',  icon: DollarSign },
      { name: 'Payroll Reports',  path: '/payroll/reports',     icon: BarChart3 },
    ],
  },
  {
    group: 'ADMINISTRATION',
    items: [
      { name: 'Company Master',   path: '/companies',         icon: Building2 },
      { name: 'Company Settings', path: '/settings',          icon: Settings },
      { name: 'User Management',  path: '/admin/users',       icon: Users },
      { name: 'Roles & Permissions',path: '/admin/roles',     icon: ShieldCheck },
      { name: 'Currency Master',  path: '/currency',          icon: Globe },
    ],
  },
  {
    group: 'AUDIT',
    items: [
      { name: 'Audit Log',        path: '/audit',             icon: ShieldCheck },
      { name: 'Voucher History',  path: '/audit/vouchers',    icon: ClipboardList },
    ],
  },
];

function NavItem({ item, depth = 0 }) {
  const location = useLocation();
  const [open, setOpen] = useState(() =>
    item.sub?.some(s => location.pathname + location.search === s.path || location.pathname === s.path)
  );

  if (item.sub) {
    const anyActive = item.sub.some(s => location.pathname === s.path);
    return (
      <li>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-[13px] font-medium ${
            anyActive ? 'bg-purple-50/60 text-purple-700 font-semibold' : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <item.icon size={15} className="opacity-75 shrink-0" />
            <span>{item.name}</span>
          </div>
          {open ? <ChevronDown size={12} className="opacity-50" /> : <ChevronRight size={12} className="opacity-50" />}
        </button>
        {open && (
          <ul className="pl-6 space-y-1 mt-1">
            {item.sub.map((s, i) => (
              <li key={i}>
                <NavLink
                  to={s.path}
                  className={({ isActive }) =>
                    `block px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      isActive ? 'bg-purple-50/60 text-purple-700 font-semibold' : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-800'
                    }`
                  }
                >
                  {s.name}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors text-[13px] font-medium ${
            isActive ? 'bg-purple-50/60 text-purple-700 font-semibold' : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
          }`
        }
      >
        <item.icon size={15} className="opacity-75 shrink-0" />
        <span>{item.name}</span>
      </NavLink>
    </li>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full hidden md:flex">
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {NAV.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="text-[9px] font-bold text-slate-400/80 uppercase tracking-widest px-3">
              {section.group}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item, i) => (
                <NavItem key={i} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-center text-slate-500">
          CubeBooks ERP v2.0
        </div>
      </div>
    </aside>
  );
}
