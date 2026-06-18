import React, { useEffect, useState } from 'react';
import { Users, ClipboardList, Briefcase, Clock3, CheckCircle, AlertTriangle, DollarSign, CalendarRange, Plus, FileText, UserPlus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';

const StatCard = ({ icon: Icon, label, value, hint, tone = 'default', onClick }) => {
  const toneClasses = {
    default: 'stat-icon blue',
    success: 'stat-icon emerald',
    warning: 'stat-icon amber',
    info: 'stat-icon purple'
  };

  return (
    <div
      onClick={onClick}
      className={`card stat-card ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
    >
      <div className={toneClasses[tone] || toneClasses.default}>
        <Icon size={24} />
      </div>
      <div className="stat-details">
        <h3>{label}</h3>
        <div className="value">{value}</div>
        {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{hint}</p>}
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, color = 'indigo' }) => (
  <div
    onClick={onClick}
    className={`card cursor-pointer hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3 p-6 min-h-[140px] border-t-4 border-t-${color}-500`}
  >
    <div className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center mb-1`}>
      <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    <span className="text-sm font-bold text-slate-700 text-center">{label}</span>
  </div>
);

const HRDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [requisitions, setRequisitions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [offers, setOffers] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [offboarding, setOffboarding] = useState([]);
  const [payrollEntries, setPayrollEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sum, reqs, cands, tasks, offs, perf, offb, payroll] = await Promise.all([
          hrService.getSummary(),
          hrService.listRequisitions(),
          hrService.listCandidates(),
          hrService.listTasks(),
          hrService.listOffers(),
          hrService.listPerformance(),
          hrService.listOffboarding(),
          hrService.listPayroll(),
        ]);
        setSummary(sum);
        setRequisitions(reqs.slice(0, 3));
        setCandidates(cands.slice(0, 3));
        setOnboarding(tasks.slice(0, 3));
        setOffers(offs.slice(0, 1));
        setPerformance(perf.slice(0, 3));
        setOffboarding(offb.slice(0, 2));
        setPayrollEntries(payroll.slice(0, 1));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900">HR Dashboard</h1>
        <p className="text-xs md:text-sm text-slate-500">Manage your workforce lifecycle</p>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Requisitions" value={summary?.requisitions ?? '—'} hint="Draft / pending / approved" onClick={() => navigate('/hr/requisitions')} />
        <StatCard icon={Users} label="Candidates" value={summary?.candidates ?? '—'} hint="In pipeline" tone="info" onClick={() => navigate('/hr/recruitment')} />
        <StatCard icon={Clock3} label="Onboarding" value={summary?.onboarding_tasks ?? '—'} hint="Pending tasks" tone="warning" onClick={() => navigate('/hr/offers-onboarding')} />
        <StatCard icon={DollarSign} label="Payroll" value={summary?.payroll ?? '—'} hint="Entries" tone="success" onClick={() => navigate('/hr/payroll')} />
      </div>

      {/* Requisitions & Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Open Positions</h2>
            <span className="btn btn-primary">{requisitions.length}</span>
          </div>
          <div className="space-y-2">
            {requisitions.map((req) => (
              <div key={req.id} className="card flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-all mb-3" onClick={() => navigate('/hr/requisitions')}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{req.title}</p>
                  <p className="text-xs text-slate-500">{req.department}</p>
                </div>
                <span className={`shrink-0 ml-2 text-[11px] px-2 py-1 rounded-full ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>{req.status}</span>
              </div>
            ))}
            {(!loading && requisitions.length === 0) && (
              <p className="text-sm text-slate-500 py-4 text-center">No requisitions yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Candidates</h2>
            <span className="btn btn-success">{candidates.length}</span>
          </div>
          <div className="space-y-2">
            {candidates.map((cand) => {
              const rating = cand.rating || {};
              const score = ((rating.technical || 0) * 0.4 + (rating.communication || 0) * 0.3 + (rating.domain || 0) * 0.2 + (rating.culture || 0) * 0.1).toFixed(1);
              return (
                <div key={cand.id} className="card flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-all mb-3" onClick={() => navigate('/hr/recruitment')}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{cand.name}</p>
                    <p className="text-xs text-slate-500">{cand.position || cand.position_applied}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-medium text-indigo-600">{score}</span>
                    <span className={`text-[11px] px-2 py-1 rounded-full ${cand.status === 'Hired' ? 'bg-emerald-100 text-emerald-700' :
                        cand.status === 'Interview' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>{cand.status}</span>
                  </div>
                </div>
              );
            })}
            {(!loading && candidates.length === 0) && (
              <p className="text-sm text-slate-500 py-4 text-center">No candidates yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding & Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Onboarding Tasks</h2>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {onboarding.map((task) => (
              <div key={task.id} className="card flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-all mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.owner} {task.due_date ? `• ${task.due_date}` : ''}</p>
                </div>
                <span className={`shrink-0 ml-2 text-[11px] px-2 py-1 rounded-full ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>{task.status}</span>
              </div>
            ))}
            {(!loading && onboarding.length === 0) && (
              <p className="text-sm text-slate-500 py-4 text-center">No onboarding tasks</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Performance</h2>
            <CalendarRange className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="space-y-2">
            {performance.map((row) => (
              <div key={row.id} className="card flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-all mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{row.employee}</p>
                  <p className="text-xs text-slate-500">Score: {row.final_score}</p>
                </div>
                <span className={`shrink-0 ml-2 text-[11px] px-2 py-1 rounded-full ${row.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>{row.status}</span>
              </div>
            ))}
            {(!loading && performance.length === 0) && (
              <p className="text-sm text-slate-500 py-4 text-center">No performance reviews</p>
            )}
          </div>
        </div>
      </div>

      {/* Offboarding */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Offboarding</h2>
          <Briefcase className="w-4 h-4 text-slate-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offboarding.map((item) => (
            <div key={item.id} className="card flex items-center justify-between p-4 cursor-pointer hover:shadow-md transition-all">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{item.employee}</p>
                <p className="text-xs text-slate-500">{item.step}</p>
              </div>
              <span className={`shrink-0 ml-2 text-[11px] px-2 py-1 rounded-full ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{item.status}</span>
            </div>
          ))}
          {(!loading && offboarding.length === 0) && (
            <p className="text-sm text-slate-500 py-4 text-center col-span-2">No offboarding cases</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
