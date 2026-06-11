import { useNavigate } from 'react-router-dom';
import {
  Scale, TrendingUp, PieChart, BookMarked, DollarSign, CreditCard,
  AlertTriangle, ClipboardList, FileText, BarChart3, BookOpen, BadgePercent,
} from 'lucide-react';

const REPORT_CARDS = [
  {
    section: 'Core Financial Statements',
    items: [
      { label: 'Trial Balance',        desc: 'Debit/credit balance of all ledgers',           path: '/reports/trial-balance',      icon: Scale },
      { label: 'Profit & Loss',        desc: 'Income vs expenses, net profit/loss',            path: '/reports/profit-loss',        icon: TrendingUp },
      { label: 'Balance Sheet',        desc: 'Assets vs liabilities as on date',               path: '/reports/balance-sheet',      icon: PieChart },
    ],
  },
  {
    section: 'Ledger & Books',
    items: [
      { label: 'Ledger Report',        desc: 'Transaction-wise ledger statement',              path: '/reports/ledger',             icon: BookMarked },
      { label: 'Day Book',             desc: 'Chronological voucher listing',                  path: '/day-book',                   icon: BookOpen },
      { label: 'Cash Book',            desc: 'Cash receipts and payments',                     path: '/reports/cash-book',          icon: DollarSign },
      { label: 'Bank Book',            desc: 'Bank deposits and withdrawals',                  path: '/reports/bank-book',          icon: CreditCard },
    ],
  },
  {
    section: 'Party & Transaction Reports',
    items: [
      { label: 'Outstanding Report',   desc: 'Receivables & payables by party',               path: '/reports/outstanding',        icon: AlertTriangle },
      { label: 'Sales Register',       desc: 'Sales invoices with GST breakup',               path: '/reports/sales-register',     icon: ClipboardList },
      { label: 'Purchase Register',    desc: 'Purchase bills with supplier summary',          path: '/reports/purchase-register',  icon: FileText },
    ],
  },
  {
    section: 'Analysis & Compliance',
    items: [
      { label: 'Ratio Analysis',       desc: 'Gross/net profit ratio, current ratio',         path: '/reports/ratio-analysis',     icon: BarChart3 },
      { label: 'GST Reports',          desc: 'GSTR-1, GSTR-3B, input tax credit',             path: '/gst',                        icon: BadgePercent },
    ],
  },
];

export default function Reports() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
          <FileText size={18} />
        </div>
        <div>
          <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Reports Centre</h1>
          <p className="cb-page-subtitle text-slate-400 mt-0.5">All financial, accounting & compliance reports</p>
        </div>
      </div>

      {REPORT_CARDS.map(section => (
        <div key={section.section} className="space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest px-1">
            {section.section}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.items.map(card => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="cb-card p-4 text-left hover:bg-slate-50/70 hover:border-purple-300 transition-all hover:scale-[1.01] group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-slate-50 border border-slate-200/50 text-slate-500 group-hover:text-purple-600 group-hover:bg-purple-50 group-hover:border-purple-100/60 transition-colors">
                    <card.icon size={16} />
                  </div>
                  <p className="font-semibold text-slate-800 text-xs group-hover:text-purple-700 transition-colors">
                    {card.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
