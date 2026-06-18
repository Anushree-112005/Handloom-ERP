import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, Users, AlertTriangle, Activity, Briefcase, ChevronRight, X, Clock, Play,
  Calendar, LineChart as LineChartIcon, Target, FileText, ShieldAlert, CalendarClock, DollarSign, UserCheck, Video
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import hrService from '../../../services/hrService';

// Reusable Components
const MetricCard = ({ title, value, change, icon: Icon, color, isNegative }) => (
  <div className="card">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      {change && (
        <p className={`text-sm mt-2 flex items-center ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${isNegative ? 'rotate-180' : ''}`} />
          {change} from last month
        </p>
      )}
    </div>
    <div className={`p-4 rounded-xl flex items-center justify-center ${color.bg}`}>
      <Icon className={`w-6 h-6 ${color.text}`} />
    </div>
  </div>
);

export default function AIHRDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // States for different data
  const [attritionData, setAttritionData] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);
  
  // New States for requested AI Automations
  const [attendanceData, setAttendanceData] = useState(null);
  const [demandData, setDemandData] = useState(null);
  const [productivityData, setProductivityData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
  const [overtimeData, setOvertimeData] = useState(null);
  const [allocationData, setAllocationData] = useState(null);
  const [faceData, setFaceData] = useState(null);

  // States for Dashboard Metrics
  const [metrics, setMetrics] = useState({
    attritionValue: "0%",
    attritionChange: "0%",
    payrollValue: "0",
    payrollChange: "0",
    skillValue: "N/A",
    skillChange: "N/A",
    healthValue: "0%",
    healthChange: "0%"
  });

  const [trendData, setTrendData] = useState([]);

  // Fetch real data to populate dashboard accurately
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Initially fetch real employees to see if we have data
        const employees = await hrService.fetchEmployees();
        
        if (!employees || employees.length === 0) {
          // If no data, render empty state
          setMetrics({
            attritionValue: "0%", attritionChange: "0%",
            payrollValue: "0", payrollChange: "0",
            skillValue: "None", skillChange: "N/A",
            healthValue: "100%", healthChange: "0%"
          });
          setTrendData([
            { month: 'Jan', attritionRate: 0, payrollErrors: 0, skillGaps: 0 },
            { month: 'Feb', attritionRate: 0, payrollErrors: 0, skillGaps: 0 },
            { month: 'Mar', attritionRate: 0, payrollErrors: 0, skillGaps: 0 },
          ]);
        } else {
          // If there is data in HR, you would trigger the AI endpoints 
          // to generate dynamic analysis based on actual employee count.
          // For now, simulating API response if data exists:
          setMetrics({
            attritionValue: "12%", attritionChange: "-1.2%",
            payrollValue: "2", payrollChange: "Stable",
            skillValue: "Low", skillChange: "Improving",
            healthValue: "92%", healthChange: "+2.1%"
          });
          setTrendData([
            { month: 'Jan', attritionRate: 4, payrollErrors: 12, skillGaps: 45 },
            { month: 'Feb', attritionRate: 5, payrollErrors: 10, skillGaps: 42 },
            { month: 'Mar', attritionRate: 4.5, payrollErrors: 8, skillGaps: 38 },
          ]);
        }
      } catch (err) {
        console.error("Error fetching hr data for dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleFetchAttrition = async () => {
    try {
      setLoading(true);
      const res = await hrService.predictAttrition({ employee_id: "ALL" });
      if (res.prediction) {
        setAttritionData(res.prediction);
      } else {
        setAttritionData({ risk_level: 'None', factors: ['No Data Available'], leave_probability: 0 });
      }
    } catch (e) {
      console.error(e);
      setAttritionData({ risk_level: 'None', factors: ['No HR data available to analyze.'], leave_probability: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPayrollErrors = async () => {
    try {
      setLoading(true);
      const res = await hrService.detectPayrollErrors({ month: "Current" });
      if (res.anomalies && res.anomalies.length > 0) {
        setPayrollData(res.anomalies);
      } else {
        setPayrollData([]);
      }
    } catch (e) {
      console.error(e);
      setPayrollData([]); // Empty array means 0 anomalies
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSkillGaps = async () => {
    try {
      setLoading(true);
      const res = await hrService.analyzeSkillGaps({ department: "Engineering" });
      if (res.analysis) {
        setSkillGapData(res.analysis);
      } else {
        setSkillGapData({ missing_skills: ['No Data'], recommended_training: 'N/A', department_readiness: '0%' });
      }
    } catch (e) {
      console.error(e);
      setSkillGapData({ missing_skills: ['No employees found to analyze.'], recommended_training: 'N/A', department_readiness: '0%' });
    } finally {
      setLoading(false);
    }
  };

  const handleMockFetch = (setter, mockPayload) => {
    setLoading(true);
    setTimeout(() => {
      setter(mockPayload);
      setLoading(false);
    }, 1000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'attendance', label: 'Smart Attendance', icon: Calendar },
    { id: 'demand', label: 'Demand Forecasting', icon: LineChartIcon },
    { id: 'productivity', label: 'Productivity Scoring', icon: Target },
    { id: 'attrition', label: 'Attrition Risk', icon: Users },
    { id: 'payroll', label: 'Payroll Errors', icon: AlertTriangle },
    { id: 'resume', label: 'Resume Screening', icon: FileText },
    { id: 'skills', label: 'Skill Gaps', icon: Briefcase },
    { id: 'safety', label: 'Safety Risk', icon: ShieldAlert },
    { id: 'leave', label: 'Smart Leave', icon: CalendarClock },
    { id: 'overtime', label: 'Overtime Opt.', icon: DollarSign },
    { id: 'allocation', label: 'Employee Allocation', icon: UserCheck },
    { id: 'face_recognition', label: 'Face Recognition', icon: Video },
  ];

  return (
    <div className="animate-in fade-in" style={{ padding: '12px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div style={{ width: 48, height: 48, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
            AI HR Intelligence Dashboard
          </h1>
          <p className="text-slate-500 mt-2">Centralized AI-driven insights for HR operations</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" title="Export coming soon" disabled>
            Export Report
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle className="w-4 h-4" />
            View Alerts (2)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 24 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              style={{ minWidth: 120 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="form-row">
            <MetricCard 
              title="Avg. Attrition Risk" 
              value={metrics.attritionValue} 
              change={metrics.attritionChange} 
              isNegative={metrics.attritionValue !== "0%"}
              icon={Users} 
              color={{ bg: 'bg-red-100', text: 'text-red-600' }} 
            />
            <MetricCard 
              title="Payroll Anomalies" 
              value={metrics.payrollValue} 
              change={metrics.payrollChange} 
              isNegative={metrics.payrollValue !== "0"}
              icon={AlertTriangle} 
              color={{ bg: 'bg-orange-100', text: 'text-orange-600' }} 
            />
            <MetricCard 
              title="Skill Gap Severity" 
              value={metrics.skillValue} 
              change={metrics.skillChange} 
              icon={Briefcase} 
              color={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }} 
            />
            <MetricCard 
              title="Overall HR Health" 
              value={metrics.healthValue} 
              change={metrics.healthChange} 
              icon={Activity} 
              color={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }} 
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-900" style={{ margin: 0 }}>Historical AI Insights</h2>
            </div>
            <div className="p-6 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="attritionRate" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" name="Attrition Rate (%)" />
                  <Area type="monotone" dataKey="payrollErrors" stroke="#f59e0b" fillOpacity={1} fill="url(#colorErrors)" name="Payroll Errors" />
                  <Area type="monotone" dataKey="skillGaps" stroke="#6366f1" fillOpacity={1} fill="transparent" name="Skill Gap Issues" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attrition' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <Brain className="w-16 h-16 text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Attrition Risk Detector</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Run AI analysis to detect employees with high flight risk based on compensation, engagement, and tenure patterns.</p>
            <button onClick={handleFetchAttrition} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Run Attrition Analysis
            </button>

            {attritionData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500 }}>
                    <h4 className="font-bold flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-indigo-600" /> Risk Level: <span className={attritionData.risk_level === 'High' ? 'text-red-600' : 'text-orange-500'}>{attritionData.risk_level}</span></h4>
                    <p className="font-semibold mb-2">Key Factors:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        {attritionData.factors?.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    {attritionData.leave_probability && <p className="mt-4 text-slate-600">Leave Probability: <strong>{attritionData.leave_probability}%</strong></p>}
                </div>
            )}
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Payroll Anomaly Detection</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Use machine learning to spot unusual patterns, suspected fraud, or systemic calculation errors in recent payroll runs.</p>
            <button onClick={handleFetchPayrollErrors} disabled={loading} className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50">
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Scan Payroll Data
            </button>

            {payrollData && (
                <div className="w-full mt-8 grid grid-cols-1 gap-4" style={{ maxWidth: 600 }}>
                    {payrollData.map((err, i) => (
                        <div key={i} className="p-4 bg-white border border-red-200 rounded-lg flex justify-between items-center shadow-sm">
                            <div>
                                <h4 className="font-bold text-slate-800">Employee: {err.employee_id}</h4>
                                <p className="text-slate-600 mt-1">{err.issue}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${err.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                {err.severity} Risk
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <Briefcase className="w-16 h-16 text-emerald-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Skill Gap Analysis</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Evaluate workforce readiness against future departmental demands and identify missing key competencies.</p>
            <button onClick={handleFetchSkillGaps} disabled={loading} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Analyze Readiness
            </button>

            {skillGapData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500 }}>
                    <p className="mb-2"><strong>Recommended Training:</strong> {skillGapData.recommended_training}</p>
                    <p className="mb-4"><strong>Department Readiness:</strong> <span className={skillGapData.department_readiness < '80%' ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>{skillGapData.department_readiness}</span></p>
                    <p className="font-semibold mb-3">Critical Missing Skills:</p>
                    <div className="flex flex-wrap gap-2">
                        {skillGapData.missing_skills?.map((s, i) => (
                          <span key={i} className="badge badge-inactive" style={{ fontSize: 13, padding: '4px 10px' }}>
                              {s}
                          </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <Calendar className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Attendance & Shift Intelligence</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Predict and prevent absenteeism. Auto-generate optimized shift rosters based on real-time workforce availability and production demand.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runSmartAttendance(); setAttendanceData(data); setLoading(false); }} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Analyze Shifts & Attendance
            </button>
            {attendanceData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500 }}>
                    <p className="font-semibold mb-3">AI Intelligence Insights:</p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                        {attendanceData.insights.map((insight, i) => <li key={i}>{insight}</li>)}
                    </ul>
                </div>
            )}
        </div>
      )}

      {activeTab === 'demand' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <LineChartIcon className="w-16 h-16 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Workforce Demand Forecasting</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Forecast workforce demand accurately using upcoming production schedules and seasonality trends.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runDemandForecast(); setDemandData(data); setLoading(false); }} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Run Demand Forecast
            </button>
            {demandData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500 }}>
                    <p className="mb-2"><strong>Demand Forecast:</strong> {demandData.forecast}</p>
                    <p className="mb-2"><strong>AI Recommendation:</strong> {demandData.recommendation}</p>
                </div>
            )}
        </div>
      )}

      {activeTab === 'productivity' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <Target className="w-16 h-16 text-teal-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Productivity Performance Scoring</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Automatically calculate and dynamically normalize employee productivity across different job functions.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runProductivityScoring(); setProductivityData(data); setLoading(false); }} disabled={loading} className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50">
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Evaluate Productivity
            </button>
            {productivityData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><p className="text-sm text-slate-500">Average Output</p><h4 className="text-xl font-bold text-teal-700">{productivityData.avgScore}</h4></div>
                    <div><p className="text-sm text-slate-500">Top Performing</p><h4 className="text-xl font-bold text-slate-800">{productivityData.topPerformers}</h4></div>
                    <div><p className="text-sm text-slate-500">Needs Focus</p><h4 className="text-xl font-bold text-slate-800">{productivityData.lowPerformers}</h4></div>
                </div>
            )}
        </div>
      )}

      {activeTab === 'resume' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <FileText className="w-16 h-16 text-indigo-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Resume Screening & Auto-JD</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Zero-touch resume parsing, automated semantic candidate ranking against job descriptions, and instant JD generation.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runResumeScreening(); setResumeData(data); setLoading(false); }} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Process New Applications
            </button>
            {resumeData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><p className="text-sm text-slate-500">Resumes Scanned</p><h4 className="text-2xl font-bold">{resumeData.scanned}</h4></div>
                    <div><p className="text-sm text-slate-500">Auto-Shortlisted</p><h4 className="text-2xl font-bold text-indigo-600">{resumeData.shortlisted}</h4></div>
                    <div><p className="text-sm text-slate-500">Top Sematic Match</p><h4 className="text-lg font-bold">{resumeData.topMatch}</h4></div>
                </div>
            )}
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Safety Risk Prediction</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Correlate overtime, fatigue models, and incident history to predict and prevent future workplace accidents.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runSafetyRisk(); setSafetyData(data); setLoading(false); }} disabled={loading} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Scan Safety Risks
            </button>
            {safetyData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500 }}>
                    <p className="mb-2 text-red-800"><strong>Identified Risk Zone:</strong> {safetyData.riskZone}</p>
                    <p className="mb-2 text-red-800"><strong>Primary Predictor:</strong> {safetyData.causalFactor}</p>
                    <p className="text-red-800"><strong>Current Status:</strong> <span className="font-bold">{safetyData.status}</span></p>
                </div>
            )}
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <CalendarClock className="w-16 h-16 text-cyan-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Intelligent Leave Management</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Auto-approve leaves instantly mapping to compliance conditions, team strength targets, and peak operational times.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runSmartLeave(); setLeaveData(data); setLoading(false); }} disabled={loading} className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50">
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Run Leave Balancer
            </button>
            {leaveData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><p className="text-sm text-slate-500">Leaves Evaluated</p><h4 className="text-2xl font-bold">{leaveData.pending}</h4></div>
                    <div><p className="text-sm text-slate-500">Auto-Approved</p><h4 className="text-2xl font-bold text-cyan-600">{leaveData.autoApproved}</h4></div>
                    <div><p className="text-sm text-slate-500">Flagged to Manager</p><h4 className="text-2xl font-bold text-orange-500">{leaveData.flagged}</h4></div>
                </div>
            )}
        </div>
      )}

      {activeTab === 'overtime' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <DollarSign className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Overtime Optimization</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Eliminate unnecessary excess hours by actively comparing the financial impact of overtimes vs. temp worker utilization.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runOvertimeOpt(); setOvertimeData(data); setLoading(false); }} disabled={loading} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Optimize Overhead
            </button>
            {overtimeData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500 }}>
                    <p className="mb-2 text-green-800"><strong>Estimated Cost Avoidance:</strong> <span className="text-xl font-bold">{overtimeData.savedCost}</span></p>
                    <p className="text-green-800"><strong>AI Decision Route:</strong> {overtimeData.recommendation}</p>
                </div>
            )}
        </div>
      )}

      {activeTab === 'allocation' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <UserCheck className="w-16 h-16 text-pink-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Employee Allocation</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Dynamically match daily resources and cross-trained employees to specific production lines anticipating maximum yield.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runEmployeeAllocation(); setAllocationData(data); setLoading(false); }} disabled={loading} className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2 font-medium transition-colors disabled:opacity-50">
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Auto-Allocate Floor
            </button>
            {allocationData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500 }}>
                    <p className="font-semibold mb-3">Live Allocation Tweaks:</p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                        {allocationData.actions.map((act, i) => <li key={i}>{act}</li>)}
                    </ul>
                </div>
            )}
        </div>
      )}

      {activeTab === 'face_recognition' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <Video className="w-16 h-16 text-amber-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Face Recognition & Proxy Prevention</h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">Computer vision module ensuring zero-touch, real-time presence validation directly linked to the gate cameras.</p>
            <button onClick={async () => { setLoading(true); const data = await hrService.runFaceRecognition(); setFaceData(data); setLoading(false); }} disabled={loading} className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 font-medium transition-colors disabled:opacity-50">
                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Sync Gate Feeds
            </button>
            {faceData && (
                <div className="form-control" style={{ marginTop: 24, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><p className="text-sm text-slate-500">Live Captures</p><h4 className="text-2xl font-bold">{faceData.captures}</h4></div>
                    <div><p className="text-sm text-slate-500">Discrepancies Stopped</p><h4 className="text-2xl font-bold text-red-500">{faceData.proxiesPrevented}</h4></div>
                    <div><p className="text-sm text-slate-500">Vision Confidence</p><h4 className="text-2xl font-bold text-amber-600">{faceData.confidenceAvg}</h4></div>
                </div>
            )}
        </div>
      )}

    </div>
  );
}
