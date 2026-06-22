import React, { useEffect, useState } from 'react';
import { Users, Building2, Award, Clock, Calendar, CalendarCheck, DollarSign, Landmark, Heart, Plane, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import hrService, { 
  fetchEmployees, fetchDepartments, fetchDesignations, 
  fetchShifts, fetchAttendance, fetchExpenseClaims,
  fetchHolidays, fetchPayroll, fetchLoans, fetchBenefits, fetchTravelRequests 
} from '../../../services/hrService';

const StatCard = ({ icon: Icon, label, value, hint, tone = 'indigo', onClick }) => {
  const themes = {
    blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: '#3b82f6' },
    emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: '#10b981' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: '#f59e0b' },
    purple: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: '#a855f7' },
    indigo: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', border: '#6366f1' },
    slate: { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b', border: '#64748b' },
    teal: { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6', border: '#14b8a6' },
    rose: { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e', border: '#f43f5e' }
  };

  const theme = themes[tone] || themes.indigo;

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md`}
      style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderTop: `4px solid ${theme.border}`,
        backgroundColor: '#fff',
        borderRadius: '8px'
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: '12px', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={28} color={theme.text} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '4px' }}>
          {label}
        </div>
      </div>
    </div>
  );
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [empCount, setEmpCount] = useState(0);
  const [deptCount, setDeptCount] = useState(0);
  const [desigCount, setDesigCount] = useState(0);
  const [shiftCount, setShiftCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [claimsCount, setClaimsCount] = useState(0);
  const [deptData, setDeptData] = useState([]);
  const [recentHires, setRecentHires] = useState([]);
  
  // New extra counts
  const [holidaysCount, setHolidaysCount] = useState(0);
  const [payrollCount, setPayrollCount] = useState(0);
  const [loansCount, setLoansCount] = useState(0);
  const [benefitsCount, setBenefitsCount] = useState(0);
  const [travelCount, setTravelCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [emps, depts, desigs, shifts, attendance, claims, holidays, payroll, loans, benefits, travel] = await Promise.all([
          fetchEmployees().catch(() => []),
          fetchDepartments().catch(() => []),
          fetchDesignations().catch(() => []),
          fetchShifts().catch(() => []),
          fetchAttendance().catch(() => []),
          fetchExpenseClaims().catch(() => []),
          fetchHolidays().catch(() => []),
          fetchPayroll().catch(() => []),
          fetchLoans().catch(() => []),
          fetchBenefits().catch(() => []),
          fetchTravelRequests().catch(() => [])
        ]);
        
        setEmpCount(emps.length);
        setDeptCount(depts.length);
        setDesigCount(desigs.length);
        setShiftCount(shifts.length);
        setAttendanceCount(attendance.length);
        setClaimsCount(claims.filter(c => c.status === 'Pending').length);
        
        setHolidaysCount(holidays.length);
        setPayrollCount(payroll.length);
        setLoansCount(loans.length);
        setBenefitsCount(benefits.length);
        setTravelCount(travel.length);
        
        // Setup Department Headcount Data
        const dCounts = {};
        emps.forEach(emp => {
          const d = emp.department || 'Unassigned';
          dCounts[d] = (dCounts[d] || 0) + 1;
        });
        const formattedDeptData = Object.keys(dCounts)
          .map(k => ({ name: k, value: dCounts[k] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // top 5
        setDeptData(formattedDeptData);
        
        // Setup Recent Hires List
        setRecentHires(emps.slice(-5).reverse());
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">HR Modules</h1>
        <p className="text-sm text-slate-500">Manage your workforce lifecycle and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Employees" value={loading ? '...' : empCount} tone="indigo" onClick={() => navigate('/hr/employee-master')} />
        <StatCard icon={Building2} label="Departments" value={loading ? '...' : deptCount} tone="purple" onClick={() => navigate('/hr/departments')} />
        <StatCard icon={Clock} label="Total Shifts" value={loading ? '...' : shiftCount} tone="emerald" onClick={() => navigate('/hr/shifts')} />
        <StatCard icon={Receipt} label="Pending Claims" value={loading ? '...' : claimsCount} tone="amber" onClick={() => navigate('/hr/expense')} />
      </div>

      {/* Middle Layout matching the screenshot exactly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal Progress Bar Chart */}
        <div className="card lg:col-span-2">
          <div className="card-header border-b border-slate-100 pb-4 mb-4">
            <h2 className="card-title text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Headcount by Department
            </h2>
          </div>
          <div className="space-y-6 px-2">
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : deptData.length > 0 ? (
              deptData.map((d, i) => {
                const max = Math.max(...deptData.map(x => x.value)) || 1;
                const percentage = (d.value / max) * 100;
                const colors = ['#f59e0b', '#ec4899', '#10b981', '#6366f1', '#06b6d4'];
                const color = colors[i % colors.length];
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-700">{d.name}</span>
                      <span className="font-bold text-slate-900">{d.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm">No department data</p>
            )}
          </div>
        </div>

        {/* Right Side List */}
        <div className="card">
          <div className="card-header border-b border-slate-100 pb-4 mb-4">
            <h2 className="card-title text-lg flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-purple-500" /> Recent Hires
            </h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : recentHires.length > 0 ? (
              recentHires.map((emp, i) => (
                <div key={i} className="flex justify-between items-start border-b border-slate-50 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{emp.name || emp.employee_id}</p>
                    <p className="text-xs text-slate-500 mt-1">Status: <span className="text-emerald-600">{emp.employment_status || 'Active'}</span></p>
                  </div>
                  <span className="text-xs text-slate-400">{emp.department || 'Unassigned'}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No recent hires</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8 mt-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">All HR Modules</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard icon={Building2} label="Departments" value={deptCount} tone="slate" onClick={() => navigate('/hr/departments')} />
            <StatCard icon={Award} label="Designations" value={desigCount} tone="purple" onClick={() => navigate('/hr/designations')} />
            <StatCard icon={Clock} label="Shifts" value={shiftCount} tone="blue" onClick={() => navigate('/hr/shifts')} />
            <StatCard icon={Calendar} label="Holidays" value={holidaysCount} tone="rose" onClick={() => navigate('/hr/holidays')} />
            <StatCard icon={Users} label="Employees" value={empCount} tone="indigo" onClick={() => navigate('/hr/employee-master')} />
            <StatCard icon={CalendarCheck} label="Attendance" value={attendanceCount} tone="emerald" onClick={() => navigate('/hr/attendance')} />
            <StatCard icon={DollarSign} label="Payroll" value={payrollCount} tone="amber" onClick={() => navigate('/hr/payroll')} />
            <StatCard icon={Landmark} label="Loans" value={loansCount} tone="blue" onClick={() => navigate('/hr/loans')} />
            <StatCard icon={Heart} label="Benefits" value={benefitsCount} tone="rose" onClick={() => navigate('/hr/benefits')} />
            <StatCard icon={Plane} label="Travel" value={travelCount} tone="teal" onClick={() => navigate('/hr/travel')} />
            <StatCard icon={Receipt} label="Expense" value={claimsCount} tone="purple" onClick={() => navigate('/hr/expense')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
