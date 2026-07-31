import React, { useEffect, useState } from 'react';
import { Users, Building2, Award, Clock, Calendar, CalendarCheck, DollarSign, Landmark, Heart, Plane, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import hrService, { 
  fetchEmployees, fetchDepartments, fetchDesignations, 
  fetchShifts, fetchAttendance, fetchExpenseClaims,
  fetchHolidays, fetchPayroll, fetchLoans, fetchBenefits, fetchTravelRequests 
} from '../../../services/hrService';

const PremiumStatCard = ({ icon: Icon, label, value, tone = 'indigo', onClick }) => {
  const themes = {
    blue: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    emerald: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    amber: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    purple: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    indigo: { color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)' },
    rose: { color: '#e11d48', bg: 'rgba(225, 29, 72, 0.1)' }
  };

  const theme = themes[tone] || themes.indigo;

  return (
    <div
      onClick={onClick}
      className="card stat-card cursor-pointer"
      style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}
    >
      <div className="stat-icon" style={{ background: theme.bg, color: theme.color }}>
        <Icon size={24} />
      </div>
      <div className="stat-details">
        <h3>{label}</h3>
        <div className="value">{value}</div>
      </div>
    </div>
  );
};

const NavTile = ({ icon: Icon, title, desc, onClick }) => {
  return (
    <div 
      className="card stat-card cursor-pointer" 
      onClick={onClick}
      style={{ border: 'none', boxShadow: 'none', padding: '16px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }}
    >
      <div className="stat-icon" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', width: '40px', height: '40px', flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      <div className="stat-details" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '2px', textTransform: 'none' }}>{title}</h3>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{desc}</div>
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
    <div className="flex flex-col gap-8 pb-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">HR Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage your workforce lifecycle and operations efficiently</p>
        </div>
      </div>

      {/* Top Main Metrics (4 Key Focus Areas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumStatCard icon={Users} label="Total Employees" value={loading ? '...' : empCount} tone="indigo" onClick={() => navigate('/hr/employee-master')} />
        <PremiumStatCard icon={Building2} label="Departments" value={loading ? '...' : deptCount} tone="purple" onClick={() => navigate('/hr/departments')} />
        <PremiumStatCard icon={Clock} label="Total Shifts" value={loading ? '...' : shiftCount} tone="emerald" onClick={() => navigate('/hr/shifts')} />
        <PremiumStatCard icon={Receipt} label="Pending Claims" value={loading ? '...' : claimsCount} tone="amber" onClick={() => navigate('/hr/expense')} />
      </div>

      {/* Charts / Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount by Department */}
        <div className="card lg:col-span-2 p-6" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20} /></div>
            <h2 className="text-lg font-bold text-slate-800">Headcount by Department</h2>
          </div>
          <div className="space-y-6">
            {loading ? (
              <div className="h-32 flex items-center justify-center text-slate-400">Loading data...</div>
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
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm italic">No department data available</p>
            )}
          </div>
        </div>

        {/* Recent Hires */}
        <div className="card p-6" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CalendarCheck size={20} /></div>
            <h2 className="text-lg font-bold text-slate-800">Recent Hires</h2>
          </div>
          <div className="space-y-5">
            {loading ? (
              <div className="h-32 flex items-center justify-center text-slate-400">Loading data...</div>
            ) : recentHires.length > 0 ? (
              recentHires.map((emp, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/hr/employee-master')}>
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {emp.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{emp.name || emp.employee_id}</p>
                    <p className="text-xs text-slate-500 truncate">{emp.department || 'Unassigned'}</p>
                  </div>
                  <div className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                    {emp.employment_status || 'Active'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm italic">No recent hires</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access / App Drawer Navigation */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NavTile icon={Building2} title="Departments" desc={`${deptCount} Departments`} onClick={() => navigate('/hr/departments')} />
          <NavTile icon={Award} title="Designations" desc={`${desigCount} Roles`} onClick={() => navigate('/hr/designations')} />
          <NavTile icon={Clock} title="Shifts" desc={`${shiftCount} Active Shifts`} onClick={() => navigate('/hr/shifts')} />
          <NavTile icon={Calendar} title="Holidays" desc={`${holidaysCount} Upcoming`} onClick={() => navigate('/hr/holidays')} />
          <NavTile icon={Users} title="Employees" desc={`${empCount} Staff members`} onClick={() => navigate('/hr/employee-master')} />
          <NavTile icon={CalendarCheck} title="Attendance" desc="Track daily logs" onClick={() => navigate('/hr/attendance')} />
          <NavTile icon={DollarSign} title="Payroll" desc="Manage salaries" onClick={() => navigate('/hr/payroll')} />
          <NavTile icon={Landmark} title="Loans" desc={`${loansCount} Active Loans`} onClick={() => navigate('/hr/loans')} />
          <NavTile icon={Heart} title="Benefits" desc="Manage perks" onClick={() => navigate('/hr/benefits')} />
          <NavTile icon={Plane} title="Travel" desc={`${travelCount} Requests`} onClick={() => navigate('/hr/travel')} />
          <NavTile icon={Receipt} title="Expense Claims" desc={`${claimsCount} Pending`} onClick={() => navigate('/hr/expense')} />
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
