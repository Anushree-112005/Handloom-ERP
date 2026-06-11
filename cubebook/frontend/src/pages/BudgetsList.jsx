import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCompanyStore from "../store/companyStore";
import { FolderHeart, ArrowLeft, Plus, Trash2, Check, X, Save, Search, Calendar } from "lucide-react";

const MOCK_BUDGETS_KEY = "cb_mock_budgets";

export default function BudgetsList() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    from: "2026-04-01",
    to: "2026-06-30",
    amount: 50000,
    status: "Active"
  });

  const defaultBudgets = [
    { name: "Q1 Marketing Budget", from: "2026-04-01", to: "2026-06-30", amount: 150000, status: "Active" },
    { name: "Office Operations FY26", from: "2026-04-01", to: "2027-03-31", amount: 300000, status: "Active" },
  ];

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem(MOCK_BUDGETS_KEY);
    return saved ? JSON.parse(saved) : defaultBudgets;
  });

  useEffect(() => {
    localStorage.setItem(MOCK_BUDGETS_KEY, JSON.stringify(budgets));
  }, [budgets]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    
    setBudgets([...budgets, { ...form }]);
    setSuccessMsg(`Budget "${form.name}" added successfully!`);
    setForm({ name: "", from: "2026-04-01", to: "2026-06-30", amount: 50000, status: "Active" });
    setShowAddModal(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (name) => {
    if (confirm(`Are you sure you want to remove the budget "${name}"?`)) {
      setBudgets(budgets.filter(b => b.name !== name));
    }
  };

  const filtered = budgets.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Calendar size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to view budgets.</p>
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
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">List of Budgets</h1>
            <p className="cb-page-subtitle">Configure department allocations, expense caps, and budget period definitions</p>
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
            placeholder="Search budgets..."
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
            <Plus size={14} /> Add Budget
          </button>
        </div>
      </div>

      {/* Budgets Table */}
      <div className="cb-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 cb-th w-1/3">Budget Name</th>
                <th className="px-6 py-4 cb-th w-28 text-center">Period From</th>
                <th className="px-6 py-4 cb-th w-28 text-center">Period To</th>
                <th className="px-6 py-4 cb-th text-right">Budget Value (₹)</th>
                <th className="px-6 py-4 cb-th text-center w-24">Status</th>
                <th className="px-6 py-4 cb-th text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 cb-td">
                    No budget records created yet.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 cb-td font-semibold text-purple-700">{item.name}</td>
                    <td className="px-6 py-4 cb-td text-center font-mono text-xs text-slate-500">{item.from}</td>
                    <td className="px-6 py-4 cb-td text-center font-mono text-xs text-slate-500">{item.to}</td>
                    <td className="px-6 py-4 cb-td text-right font-mono font-bold text-slate-800">
                      ₹{item.amount.toLocaleString()}.00
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
                        title="Remove Budget"
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

      {/* Add Budget Modal */}
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
              <span className="text-sm font-semibold text-slate-800">Create Budget Master</span>
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
                <span className="cb-label">Budget Name *</span>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="cb-input text-xs py-1.5 px-3"
                  placeholder="e.g. Q1 Marketing Budget"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="cb-label">Period From</span>
                  <input
                    type="date"
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    className="cb-input text-xs py-1 px-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="cb-label">Period To</span>
                  <input
                    type="date"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    className="cb-input text-xs py-1 px-2"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="cb-label">Allocated Limit (₹) *</span>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="cb-input text-xs py-1.5 px-3"
                />
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
                Create Budget
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
