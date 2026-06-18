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

      <div className="flex flex-col gap-10">
        {REPORT_CARDS.map(section => {
          const SectionIcon = section.items[0].icon;
          return (
            <div key={section.section}>
              <div className="flex items-center gap-3 mb-5 px-1">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <SectionIcon size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{section.section}</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {section.items.map(card => (
                <button
                  key={card.path}
                  onClick={() => navigate(card.path)}
                  className="group text-left p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 bg-white border-slate-200 hover:border-purple-400 hover:shadow-md hover:shadow-purple-600/5 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-purple-50 text-purple-600">
                    <card.icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-semibold transition-colors truncate text-slate-800 group-hover:text-purple-700">
                      {card.label}
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {card.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
