import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useCompanyStore from "../store/companyStore";
import {
  UserCheck,
  DollarSign,
  BarChart3,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  Calendar,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  FileText
} from "lucide-react";

const MOCK_EMPLOYEES_KEY = "cb_mock_employees";
const MOCK_SALARIES_KEY = "cb_mock_salaries";

const DEFAULT_EMPLOYEES = [
  { id: "EMP001", name: "Rajesh Kumar", designation: "Senior Developer", department: "Engineering", joiningDate: "2024-01-15", status: "Active", salary: 75000 },
  { id: "EMP002", name: "Priya Sharma", designation: "HR Manager", department: "Human Resources", joiningDate: "2024-06-01", status: "Active", salary: 55000 },
  { id: "EMP003", name: "Anand Subramanian", designation: "Accountant", department: "Finance", joiningDate: "2025-02-10", status: "Active", salary: 45000 },
  { id: "EMP004", name: "Kavitha Murugan", designation: "UI/UX Designer", department: "Design", joiningDate: "2025-11-01", status: "Active", salary: 50000 },
];

const DEFAULT_SALARIES = [
  { month: "May 2026", totalEmployees: 4, gross: 225000, deductions: 18000, net: 207000, status: "Paid" },
  { month: "April 2026", totalEmployees: 4, gross: 225000, deductions: 18000, net: 207000, status: "Paid" },
  { month: "March 2026", totalEmployees: 3, gross: 175000, deductions: 14000, net: 161000, status: "Paid" },
];

export default function PaymentVoucher() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();

  // Determine active tab by checking current path
  const currentPath = location.pathname;
  const activeTab = currentPath === "/payroll/processing" 
    ? "processing" 
    : currentPath === "/payroll/reports" 
      ? "reports" 
      : "employees";

  const handleTabChange = (tab) => {
    if (tab === "processing") navigate("/payroll/processing");
    else if (tab === "reports") navigate("/payroll/reports");
    else navigate("/payroll/employees");
  };

  // ── Tab 1: Employee Master Logic ──
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(MOCK_EMPLOYEES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empForm, setEmpForm] = useState({
    id: "",
    name: "",
    designation: "",
    department: "Engineering",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: 30000,
  });

  useEffect(() => {
    localStorage.setItem(MOCK_EMPLOYEES_KEY, JSON.stringify(employees));
  }, [employees]);

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!empForm.name || !empForm.designation) return;
    
    const newEmpId = empForm.id || `EMP${String(employees.length + 1).padStart(3, "0")}`;
    const newEmp = {
      id: newEmpId,
      name: empForm.name,
      designation: empForm.designation,
      department: empForm.department,
      joiningDate: empForm.joiningDate,
      status: "Active",
      salary: Number(empForm.salary) || 30000,
    };
    
    setEmployees([...employees, newEmp]);
    setEmpForm({
      id: "",
      name: "",
      designation: "",
      department: "Engineering",
      joiningDate: new Date().toISOString().split("T")[0],
      salary: 30000,
    });
    setShowAddEmpModal(false);
  };

  const toggleEmpStatus = (id) => {
    setEmployees(
      employees.map((emp) =>
        emp.id === id ? { ...emp, status: emp.status === "Active" ? "Inactive" : "Active" } : emp
      )
    );
  };

  const deleteEmployee = (id) => {
    if (confirm("Are you sure you want to remove this employee from database?")) {
      setEmployees(employees.filter((emp) => emp.id !== id));
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
    emp.id.toLowerCase().includes(empSearch.toLowerCase()) ||
    emp.designation.toLowerCase().includes(empSearch.toLowerCase())
  );

  // ── Tab 2: Salary Processing Logic ──
  const [processMonth, setProcessMonth] = useState("June 2026");
  const [salaryList, setSalaryList] = useState([]);
  const [processSuccess, setProcessSuccess] = useState(false);
  
  // Initialize salary items from active employees
  useEffect(() => {
    const activeEmps = employees.filter(emp => emp.status === "Active");
    const initialSalaries = activeEmps.map(emp => {
      const base = emp.salary;
      const hra = Math.round(base * 0.4); // 40% HRA
      const allowances = Math.round(base * 0.15); // 15% Allowances
      const pf = Math.round(base * 0.08); // 8% PF deduction
      return {
        empId: emp.id,
        name: emp.name,
        designation: emp.designation,
        base,
        hra,
        allowances,
        deductions: pf,
        net: base + hra + allowances - pf,
        paid: false
      };
    });
    setSalaryList(initialSalaries);
  }, [employees, processMonth]);

  const handleSalaryChange = (empId, field, val) => {
    setSalaryList(salaryList.map(s => {
      if (s.empId === empId) {
        const updated = { ...s, [field]: Number(val) || 0 };
        updated.net = updated.base + updated.hra + updated.allowances - updated.deductions;
        return updated;
      }
      return s;
    }));
  };

  const handleProcessPayrollSubmit = () => {
    if (salaryList.length === 0) return;
    
    const gross = salaryList.reduce((acc, curr) => acc + (curr.base + curr.hra + curr.allowances), 0);
    const deductions = salaryList.reduce((acc, curr) => acc + curr.deductions, 0);
    const net = salaryList.reduce((acc, curr) => acc + curr.net, 0);
    
    const newPayout = {
      month: processMonth,
      totalEmployees: salaryList.length,
      gross,
      deductions,
      net,
      status: "Paid"
    };

    setHistorySalaries([newPayout, ...historySalaries]);
    setProcessSuccess(true);
    setTimeout(() => {
      setProcessSuccess(false);
      handleTabChange("reports");
    }, 2000);
  };

  // ── Tab 3: Payroll Reports Logic ──
  const [historySalaries, setHistorySalaries] = useState(() => {
    const saved = localStorage.getItem(MOCK_SALARIES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SALARIES;
  });

  useEffect(() => {
    localStorage.setItem(MOCK_SALARIES_KEY, JSON.stringify(historySalaries));
  }, [historySalaries]);

  // Derived metrics
  const totalPayrollCost = historySalaries[0]?.net || 0;
  const totalDeductions = historySalaries[0]?.deductions || 0;
  const grossDisbursed = historySalaries[0]?.gross || 0;

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Briefcase size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to view payroll.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
            <UserCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Payroll Management Portal</h1>
            <p className="cb-page-subtitle">Configure employee payroll master records, process salaries, and track payroll registers</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => handleTabChange("employees")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === "employees"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <UserCheck size={16} />
          Employee Master
        </button>
        <button
          onClick={() => handleTabChange("processing")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === "processing"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <DollarSign size={16} />
          Salary Processing
        </button>
        <button
          onClick={() => handleTabChange("reports")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === "reports"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <BarChart3 size={16} />
          Payroll Reports
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* EMPLOYEE MASTER TAB */}
        {activeTab === "employees" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 cb-card">
              <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Employee name or ID..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="cb-input pl-9 text-xs py-1.5"
                />
              </div>
              <button
                onClick={() => setShowAddEmpModal(true)}
                className="cb-btn-primary text-xs py-1.5 px-3 rounded-lg"
              >
                <Plus size={14} /> Add Employee
              </button>
            </div>

            <div className="cb-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 cb-th w-24">Emp ID</th>
                      <th className="px-6 py-3 cb-th">Employee Name</th>
                      <th className="px-6 py-3 cb-th">Designation</th>
                      <th className="px-6 py-3 cb-th">Department</th>
                      <th className="px-6 py-3 cb-th">Salary (Base)</th>
                      <th className="px-6 py-3 cb-th">Status</th>
                      <th className="px-6 py-3 cb-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-slate-400 cb-td">
                          No employee records match the search.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3 cb-td font-semibold text-slate-800">{emp.id}</td>
                          <td className="px-6 py-3 cb-td font-semibold text-purple-700">{emp.name}</td>
                          <td className="px-6 py-3 cb-td">{emp.designation}</td>
                          <td className="px-6 py-3 cb-td">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                              {emp.department}
                            </span>
                          </td>
                          <td className="px-6 py-3 cb-td font-mono font-bold">₹{emp.salary.toLocaleString()}</td>
                          <td className="px-6 py-3 cb-td">
                            <button
                              onClick={() => toggleEmpStatus(emp.id)}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                emp.status === "Active"
                                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {emp.status}
                            </button>
                          </td>
                          <td className="px-6 py-3 cb-td text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => deleteEmployee(emp.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Remove Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Employee Modal */}
            {showAddEmpModal && (
              <div
                className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                onClick={() => setShowAddEmpModal(false)}
              >
                <form
                  onSubmit={handleAddEmployee}
                  className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                    <span className="text-sm font-semibold text-slate-800">Add New Employee</span>
                    <button
                      type="button"
                      onClick={() => setShowAddEmpModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Employee ID (Optional)</span>
                      <input
                        type="text"
                        value={empForm.id}
                        onChange={(e) => setEmpForm({ ...empForm, id: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                        placeholder="e.g. EMP005"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Full Name *</span>
                      <input
                        required
                        type="text"
                        value={empForm.name}
                        onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                        placeholder="Enter full name"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Designation *</span>
                      <input
                        required
                        type="text"
                        value={empForm.designation}
                        onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                        placeholder="e.g. Sales Coordinator"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Department</span>
                      <select
                        value={empForm.department}
                        onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Design">Design</option>
                        <option value="Sales">Sales</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Joining Date</span>
                      <input
                        type="date"
                        value={empForm.joiningDate}
                        onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Monthly Base Salary (₹) *</span>
                      <input
                        required
                        type="number"
                        min="0"
                        value={empForm.salary}
                        onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddEmpModal(false)}
                      className="cb-btn-secondary text-xs py-1.5 px-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cb-btn-primary text-xs py-1.5 px-3"
                    >
                      Save Employee
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* SALARY PROCESSING TAB */}
        {activeTab === "processing" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 cb-card">
              <div className="flex items-center gap-3">
                <span className="cb-label">Processing Month:</span>
                <select
                  value={processMonth}
                  onChange={(e) => setProcessMonth(e.target.value)}
                  className="cb-input max-w-[150px] py-1 px-2 text-xs"
                >
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
              </div>
              {processSuccess && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
                  <Check size={14} /> Payroll processed & disbursed!
                </span>
              )}
            </div>

            <div className="cb-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 cb-th w-28">Emp ID</th>
                      <th className="px-6 py-4 cb-th w-44">Name</th>
                      <th className="px-6 py-4 cb-th text-right w-24">Basic (₹)</th>
                      <th className="px-6 py-4 cb-th text-right w-24">HRA (₹)</th>
                      <th className="px-6 py-4 cb-th text-right w-24">Allowances (₹)</th>
                      <th className="px-6 py-4 cb-th text-right w-24">PF Ded. (₹)</th>
                      <th className="px-6 py-4 cb-th text-right w-28">Net Salary (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-slate-400 cb-td">
                          No active employees available to process.
                        </td>
                      </tr>
                    ) : (
                      salaryList.map((item) => (
                        <tr key={item.empId} className="hover:bg-slate-50/20">
                          <td className="px-6 py-4 cb-td font-semibold text-slate-800">{item.empId}</td>
                          <td className="px-6 py-4 cb-td">
                            <div className="font-semibold text-slate-800">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.designation}</div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <input
                              type="number"
                              value={item.base}
                              onChange={(e) => handleSalaryChange(item.empId, "base", e.target.value)}
                              className="cb-input text-right py-1 px-1.5 text-xs max-w-[80px]"
                            />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <input
                              type="number"
                              value={item.hra}
                              onChange={(e) => handleSalaryChange(item.empId, "hra", e.target.value)}
                              className="cb-input text-right py-1 px-1.5 text-xs max-w-[80px]"
                            />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <input
                              type="number"
                              value={item.allowances}
                              onChange={(e) => handleSalaryChange(item.empId, "allowances", e.target.value)}
                              className="cb-input text-right py-1 px-1.5 text-xs max-w-[80px]"
                            />
                          </td>
                          <td className="px-6 py-3 text-right">
                            <input
                              type="number"
                              value={item.deductions}
                              onChange={(e) => handleSalaryChange(item.empId, "deductions", e.target.value)}
                              className="cb-input text-right py-1 px-1.5 text-xs max-w-[80px]"
                            />
                          </td>
                          <td className="px-6 py-4 cb-td text-right font-mono font-bold text-slate-800">
                            ₹{item.net.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleProcessPayrollSubmit}
                disabled={salaryList.length === 0}
                className="cb-btn-primary"
              >
                <Check size={15} />
                Disburse & Approve Payroll
              </button>
            </div>
          </div>
        )}

        {/* PAYROLL REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="cb-stat-card border-l-4 border-l-purple-500 flex items-center justify-between">
                <div>
                  <p className="cb-stat-label">Last Net Payroll</p>
                  <p className="cb-stat-value text-purple-700">₹{totalPayrollCost.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>

              <div className="cb-stat-card border-l-4 border-l-teal-500 flex items-center justify-between">
                <div>
                  <p className="cb-stat-label">Gross Payroll</p>
                  <p className="cb-stat-value text-teal-700">₹{grossDisbursed.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <Activity size={20} />
                </div>
              </div>

              <div className="cb-stat-card border-l-4 border-l-pink-500 flex items-center justify-between">
                <div>
                  <p className="cb-stat-label">Total Deductions</p>
                  <p className="cb-stat-value text-pink-700">₹{totalDeductions.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
                  <FileText size={20} />
                </div>
              </div>

              <div className="cb-stat-card border-l-4 border-l-blue-500 flex items-center justify-between">
                <div>
                  <p className="cb-stat-label">Total Active Staff</p>
                  <p className="cb-stat-value text-blue-700">
                    {employees.filter(e => e.status === "Active").length}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <UserCheck size={20} />
                </div>
              </div>
            </div>

            {/* Historical Registers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 cb-card">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Historical Disbursals</span>
                <button
                  onClick={() => alert("Excel Export initiated.")}
                  className="cb-btn-secondary text-xs py-1.5 px-3 rounded-lg"
                >
                  <Download size={14} /> Export Register
                </button>
              </div>

              <div className="cb-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 cb-th">Disbursal Month</th>
                        <th className="px-6 py-3 cb-th text-center">Processed Employees</th>
                        <th className="px-6 py-3 cb-th text-right">Gross Total (₹)</th>
                        <th className="px-6 py-3 cb-th text-right">Deductions (₹)</th>
                        <th className="px-6 py-3 cb-th text-right">Net Paid (₹)</th>
                        <th className="px-6 py-3 cb-th text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historySalaries.map((hist, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 cb-td font-semibold text-slate-800">{hist.month}</td>
                          <td className="px-6 py-3.5 cb-td text-center">{hist.totalEmployees}</td>
                          <td className="px-6 py-3.5 cb-td text-right font-mono">₹{hist.gross.toLocaleString()}</td>
                          <td className="px-6 py-3.5 cb-td text-right font-mono text-pink-600">₹{hist.deductions.toLocaleString()}</td>
                          <td className="px-6 py-3.5 cb-td text-right font-mono font-bold text-slate-800">₹{hist.net.toLocaleString()}</td>
                          <td className="px-6 py-3.5 cb-td text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                              {hist.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}