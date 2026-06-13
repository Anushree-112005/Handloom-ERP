import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { PieChart as PieIcon, CheckCircle, AlertCircle, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const today = new Date().toISOString().split('T')[0];

function Side({ title, color, groups, total }) {
  const [expanded, setExpanded] = useState({});
  const toggle = g => setExpanded(p => ({ ...p, [g]: !p[g] }));

  return (
    <div className="card">
      <div className="btn btn-secondary"
        style={{ borderLeftWidth: 3, borderLeftColor: color }}>
        <span className="text-xs font-bold text-slate-800">{title}</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>₹{fmt(total)}</span>
      </div>

      <div className="flex-1 divide-y divide-slate-100">
        {Object.keys(groups || {}).length === 0 && (
          <p className="text-slate-400 text-xs text-center py-8">No entries</p>
        )}
        {Object.entries(groups || {}).map(([group, items]) => {
          const groupTotal = items.reduce((s, r) => s + r.amount, 0);
          const isOpen = expanded[group] !== false;
          return (
            <Fragment key={group}>
              <button onClick={() => toggle(group)}
                className="form-control">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-xs">
                  <span className="text-slate-400">
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                  {group}
                </div>
                <span className="font-mono text-xs text-slate-600 font-semibold">₹{fmt(groupTotal)}</span>
              </button>
              {isOpen && items.map((item, i) => (
                <div key={i} className="btn btn-primary">
                  <span className="text-xs text-slate-500 font-medium">{item.ledger}</span>
                  <span className="font-mono text-xs text-slate-700">₹{fmt(item.amount)}</span>
                </div>
              ))}
            </Fragment>
          );
        })}
      </div>

      <div className="btn btn-secondary">
        <span>Total {title}</span>
        <span className="font-mono" style={{ color }}>₹{fmt(total)}</span>
      </div>
    </div>
  );
}

export default function BalanceSheet() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOf, setAsOf] = useState(activeFy?.end_date || today);

  const { data, isLoading } = useQuery({
    queryKey: ['balance-sheet', activeCompany?.id, asOf],
    queryFn: () => reports.balanceSheet({ company_id: activeCompany.id, as_of: asOf }),
    enabled: !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Balance Sheet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="btn btn-primary">
            <PieIcon size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Balance Sheet</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Financial position summary showing Assets & Liabilities as on date
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            FY: {activeFy?.label || 'Not set'}
          </p>
        </div>
      </div>

      {/* ── Controls and Balance Status Card ── */}
      <div className="cb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold">As of Date:</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="btn btn-secondary"
              />
            </div>
          </div>

          {data && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${data.is_balanced ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {data.is_balanced ? (
                <><CheckCircle size={12} className="text-emerald-500" /> Balanced</>
              ) : (
                <><AlertCircle size={12} className="text-red-500" /> Liabilities & Assets Mismatch</>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Balance Sheet', companyName: activeCompany.name, period: `As of ${asOf}`, data, reportType: 'balance-sheet' })}
          className="btn btn-secondary"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {isLoading && <div className="text-center py-20 text-slate-400 animate-pulse text-xs">Loading balance sheet details…</div>}

      {data && (
        <div className="form-row">
          <Side title="Liabilities" color="#8b5cf6" groups={data.liabilities?.groups} total={data.liabilities?.total} />
          <Side title="Assets"      color="#3b82f6" groups={data.assets?.groups}      total={data.assets?.total} />
        </div>
      )}
    </div>
  );
}
