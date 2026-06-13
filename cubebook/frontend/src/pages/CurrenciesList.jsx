import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCompanyStore from "../store/companyStore";
import { Globe, ArrowLeft, Plus, Edit2, Trash2, Check, X, Save, Search } from "lucide-react";

const MOCK_CURRENCIES_KEY = "cb_mock_currencies";

export default function CurrenciesList() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [form, setForm] = useState({
    symbol: "",
    name: "",
    iso: "",
    decimals: 2
  });

  const defaultCurrencies = [
    { symbol: activeCompany?.currency_symbol || "₹", name: activeCompany?.currency_name || "INR", iso: activeCompany?.currency_iso_code || "INR", decimals: activeCompany?.currency_decimal_places ?? 2 },
    { symbol: "$", name: "USD Dollar", iso: "USD", decimals: 2 },
    { symbol: "€", name: "Euro", iso: "EUR", decimals: 2 }
  ];

  const [currencies, setCurrencies] = useState(() => {
    const saved = localStorage.getItem(MOCK_CURRENCIES_KEY);
    return saved ? JSON.parse(saved) : defaultCurrencies;
  });

  useEffect(() => {
    localStorage.setItem(MOCK_CURRENCIES_KEY, JSON.stringify(currencies));
  }, [currencies]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.symbol || !form.name) return;
    
    setCurrencies([...currencies, { ...form }]);
    setSuccessMsg(`Currency "${form.name}" added successfully!`);
    setForm({ symbol: "", name: "", iso: "", decimals: 2 });
    setShowAddModal(false);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (symbol) => {
    if (symbol === activeCompany?.currency_symbol) {
      alert("Cannot delete the base company currency.");
      return;
    }
    if (confirm("Are you sure you want to remove this foreign currency?")) {
      setCurrencies(currencies.filter(c => c.symbol !== symbol));
    }
  };

  const filtered = currencies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.includes(search) ||
    c.iso.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Globe size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to view currencies.</p>
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
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">List of Currencies</h1>
            <p className="cb-page-subtitle">Configure foreign exchange currencies and decimal representation parameters</p>
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
            placeholder="Search currencies..."
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
            <Plus size={14} /> Add Currency
          </button>
        </div>
      </div>

      {/* Currencies Table */}
      <div className="cb-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 cb-th w-28 text-center">Symbol</th>
                <th className="px-6 py-4 cb-th">Formal Name</th>
                <th className="px-6 py-4 cb-th">ISO Currency Code</th>
                <th className="px-6 py-4 cb-th text-center">Decimal Places</th>
                <th className="px-6 py-4 cb-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => {
                const isBase = item.symbol === activeCompany.currency_symbol;
                return (
                  <tr key={idx} className={`hover:bg-slate-50/50 ${isBase ? 'bg-purple-50/20' : ''}`}>
                    <td className="px-6 py-4 cb-td font-bold text-center text-purple-700 text-base">{item.symbol}</td>
                    <td className="px-6 py-4 cb-td font-semibold text-slate-800">
                      {item.name}
                      {isBase && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">Base Currency</span>
                      )}
                    </td>
                    <td className="px-6 py-4 cb-td font-mono font-bold">{item.iso}</td>
                    <td className="px-6 py-4 cb-td text-center">{item.decimals}</td>
                    <td className="px-6 py-4 cb-td text-right">
                      {!isBase && (
                        <button
                          onClick={() => handleDelete(item.symbol)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove Currency"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Currency Modal */}
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
              <span className="text-sm font-semibold text-slate-800">Add New Currency</span>
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
                <span className="cb-label">Currency Symbol *</span>
                <input
                  required
                  type="text"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="cb-input text-xs py-1.5 px-3"
                  placeholder="e.g. $, €, £"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="cb-label">Formal Name *</span>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="cb-input text-xs py-1.5 px-3"
                  placeholder="e.g. US Dollar"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="cb-label">ISO Code *</span>
                <input
                  required
                  type="text"
                  value={form.iso}
                  onChange={(e) => setForm({ ...form, iso: e.target.value })}
                  className="cb-input text-xs py-1.5 px-3 font-mono"
                  placeholder="e.g. USD"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="cb-label">Decimal Places</span>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={form.decimals}
                  onChange={(e) => setForm({ ...form, decimals: Number(e.target.value) })}
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
                Add Currency
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
