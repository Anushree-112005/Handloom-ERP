import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCompanyStore from "../store/companyStore";
import { ShieldAlert, ArrowLeft, Plus, Trash2, Check, X, Save, Search, Settings } from "lucide-react";

const MOCK_SCENARIOS_KEY = "cb_mock_scenarios";

export default function ScenariosList() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    type: "Forecasting",
    status: "Active"
  });

  const defaultScenarios = [
    { name: "Best Case Forecast", type: "Forecasting", status: "Active" },
    { name: "Provisional Q2 Accounts", type: "Provisional", status: "Active" },
  ];

  const [scenarios, setScenarios] = useState(() => {
    const saved = localStorage.getItem(MOCK_SCENARIOS_KEY);
    return saved ? JSON.parse(saved) : defaultScenarios;
  });

  useEffect(() => {
    localStorage.setItem(MOCK_SCENARIOS_KEY, JSON.stringify(scenarios));
  }, [scenarios]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    setScenarios([...scenarios, { ...form }]);
    setSuccessMsg(`Scenario "${form.name}" added successfully!`);
    setForm({ name: "", type: "Forecasting", status: "Active" });
    setShowAddModal(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (name) => {
    if (confirm(`Are you sure you want to remove the scenario "${name}"?`)) {
      setScenarios(scenarios.filter(s => s.name !== name));
    }
  };

  const filtered = scenarios.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Settings size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to view scenarios.</p>
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
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">List of Scenarios</h1>
            <p className="cb-page-subtitle">Define simulation scenarios, provisional voucher bounds, and forecasting models</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/masters/chart")}
          className="cb-btn-secondary"
        >
          <ArrowLeft size={15} />
          Back to Chart
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 cb-card">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cb-input pl-9 text-xs py-1.5"
          />
        </div>
        <div className="flex items-center gap-2">
          {successMsg && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
              <Check size={14} /> {successMsg}
            </span>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="cb-btn-primary text-xs py-1.5 px-3 rounded-lg"
          >
            <Plus size={14} /> Add Scenario
          </button>
        </div>
      </div>

      {/* Scenarios Table */}
      <div className="cb-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 cb-th w-1/2">Scenario Name</th>
                <th className="px-6 py-4 cb-th">Scenario Type</th>
                <th className="px-6 py-4 cb-th text-center w-24">Status</th>
                <th className="px-6 py-4 cb-th text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400 cb-td">
                    No scenario records created yet.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 cb-td font-semibold text-purple-700">{item.name}</td>
                    <td className="px-6 py-4 cb-td">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 cb-td text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 cb-td text-right">
                      <button
                        onClick={() => handleDelete(item.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove Scenario"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Scenario Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <span className="text-sm font-semibold text-slate-800">Create Scenario Master</span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="cb-label">Scenario Name *</span>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="cb-input text-xs py-1.5 px-3"
                  placeholder="e.g. Best Case Scenario"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="cb-label">Scenario Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="cb-input text-xs py-1 px-2.5"
                >
                  <option value="Forecasting">Forecasting</option>
                  <option value="Provisional">Provisional</option>
                  <option value="Budget Variance">Budget Variance</option>
                </select>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="cb-btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cb-btn-primary text-xs py-1.5 px-3"
              >
                Create Scenario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
