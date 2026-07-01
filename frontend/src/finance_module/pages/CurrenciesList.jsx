import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies } from "../api";
import { Globe, ArrowLeft, Plus, Edit2, Trash2, Check, Search, Save, Settings } from "lucide-react";

const MOCK_CURRENCIES_KEY = "cb_mock_currencies";

export default function CurrenciesList() {
  const navigate = useNavigate();
  const { activeCompany, setCompany } = useCompanyStore();
  
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null); // null if new, symbol if editing
  
  const [form, setForm] = useState({
    currency_symbol: "",
    currency_name: "",
    currency_iso_code: "",
    currency_decimal_places: 2,
    currency_show_in_millions: false,
    currency_suffix_symbol: false,
    currency_space_between_amount_and_symbol: false,
    currency_amount_words_unit: "Rupees",
    currency_amount_words_decimal: "Paise",
  });

  const defaultCurrencies = [];

  const [foreignCurrencies, setForeignCurrencies] = useState(() => {
    const saved = localStorage.getItem(MOCK_CURRENCIES_KEY);
    return saved ? JSON.parse(saved) : defaultCurrencies;
  });

  useEffect(() => {
    localStorage.setItem(MOCK_CURRENCIES_KEY, JSON.stringify(foreignCurrencies));
  }, [foreignCurrencies]);

  const updateCompanyMutation = useMutation({
    mutationFn: (payload) => companies.update(activeCompany.id, payload),
    onSuccess: (data) => {
      setCompany(data);
      handleCloseForm();
    },
  });

  const baseCurrency = {
    symbol: activeCompany?.currency_symbol || "₹", 
    name: activeCompany?.currency_name || "INR", 
    iso: activeCompany?.currency_iso_code || "INR", 
    decimals: activeCompany?.currency_decimal_places ?? 2,
    isBase: true
  };

  const allCurrencies = [baseCurrency, ...foreignCurrencies];

  const filtered = allCurrencies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.includes(search) ||
    c.iso.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setForm({
      currency_symbol: "",
      currency_name: "",
      currency_iso_code: "",
      currency_decimal_places: 2,
      currency_show_in_millions: false,
      currency_suffix_symbol: false,
      currency_space_between_amount_and_symbol: false,
      currency_amount_words_unit: "Dollars",
      currency_amount_words_decimal: "Cents",
    });
    setEditingCurrency(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (currency) => {
    if (currency.isBase) {
      setForm({
        currency_symbol: activeCompany?.currency_symbol || '₹',
        currency_name: activeCompany?.currency_name || 'INR',
        currency_iso_code: activeCompany?.currency_iso_code || 'INR',
        currency_decimal_places: activeCompany?.currency_decimal_places ?? 2,
        currency_show_in_millions: activeCompany?.currency_show_in_millions || false,
        currency_suffix_symbol: activeCompany?.currency_suffix_symbol || false,
        currency_space_between_amount_and_symbol: activeCompany?.currency_space_between_amount_and_symbol || false,
        currency_amount_words_unit: activeCompany?.currency_amount_words_unit || 'Rupees',
        currency_amount_words_decimal: activeCompany?.currency_amount_words_decimal || 'Paise',
      });
      setEditingCurrency('BASE');
    } else {
      setForm({
        currency_symbol: currency.symbol,
        currency_name: currency.name,
        currency_iso_code: currency.iso,
        currency_decimal_places: currency.decimals,
        currency_show_in_millions: false,
        currency_suffix_symbol: false,
        currency_space_between_amount_and_symbol: false,
        currency_amount_words_unit: "",
        currency_amount_words_decimal: "",
      });
      setEditingCurrency(currency.symbol);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCurrency(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.currency_symbol || !form.currency_name) return;

    if (editingCurrency === 'BASE') {
      updateCompanyMutation.mutate(form);
    } else {
      const newCurr = {
        symbol: form.currency_symbol,
        name: form.currency_name,
        iso: form.currency_iso_code,
        decimals: form.currency_decimal_places
      };

      if (editingCurrency) {
        setForeignCurrencies(foreignCurrencies.map(c => c.symbol === editingCurrency ? newCurr : c));
      } else {
        setForeignCurrencies([...foreignCurrencies, newCurr]);
      }
      handleCloseForm();
    }
  };

  const handleDelete = (symbol) => {
    if (confirm("Are you sure you want to remove this foreign currency?")) {
      setForeignCurrencies(foreignCurrencies.filter(c => c.symbol !== symbol));
    }
  };

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
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={24} color="var(--primary)" />
            Currencies
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Configure base and foreign exchange currencies</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={handleNew}
          >
            <Plus size={16} /> New Currency
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={handleCloseForm}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {!isFormOpen && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="card stat-card" style={{ '--stat-color': 'var(--primary)' }}>
              <div className="stat-icon purple">
                <Globe size={24} />
              </div>
              <div className="stat-info">
                <p>Total Currencies</p>
                <h3>{allCurrencies.length}</h3>
              </div>
            </div>
            <div className="card stat-card" style={{ '--stat-color': '#10b981' }}>
              <div className="stat-icon emerald">
                <Settings size={24} />
              </div>
              <div className="stat-info">
                <p>Base Currency</p>
                <h3>{baseCurrency.iso}</h3>
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="cb-card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyItems: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>Records ({filtered.length})</h3>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div className="table-responsive" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th className="cb-th w-28 text-center">Symbol</th>
                    <th className="cb-th">Formal Name</th>
                    <th className="cb-th">ISO Code</th>
                    <th className="cb-th text-center">Decimal Places</th>
                    <th className="cb-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${item.isBase ? 'bg-purple-50/10' : ''}`}>
                      <td className="cb-td font-bold text-center text-purple-700 text-base">{item.symbol}</td>
                      <td className="cb-td font-semibold text-slate-800">
                        {item.name}
                        {item.isBase && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">Base</span>
                        )}
                      </td>
                      <td className="cb-td font-mono font-bold">{item.iso}</td>
                      <td className="cb-td text-center">{item.decimals}</td>
                      <td className="cb-td text-right">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors mr-2"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!item.isBase && (
                          <button
                            onClick={() => handleDelete(item.symbol)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Inline Form */}
      {isFormOpen && (
        <div className="cb-card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: 'rgba(79, 70, 229, 0.1)', borderRadius: 10, color: 'var(--primary)' }}>
                <Globe size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  {editingCurrency === 'BASE' ? 'Alter Base Currency' : editingCurrency ? 'Edit Currency' : 'New Currency'}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Currency formatting and details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ padding: 24 }}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Currency Symbol <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.currency_symbol}
                  onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                  className="cb-input"
                  placeholder="e.g. $, €, £"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Formal Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.currency_name}
                  onChange={(e) => setForm({ ...form, currency_name: e.target.value })}
                  className="cb-input"
                  placeholder="e.g. US Dollar"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  ISO Code
                </label>
                <input
                  required
                  type="text"
                  value={form.currency_iso_code}
                  onChange={(e) => setForm({ ...form, currency_iso_code: e.target.value })}
                  className="cb-input font-mono"
                  placeholder="e.g. USD"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Decimal Places
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={form.currency_decimal_places}
                  onChange={(e) => setForm({ ...form, currency_decimal_places: Number(e.target.value) })}
                  className="cb-input"
                />
              </div>

              {editingCurrency === 'BASE' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                      Word representing unit (Whole)
                    </label>
                    <input
                      type="text"
                      value={form.currency_amount_words_unit}
                      onChange={(e) => setForm({ ...form, currency_amount_words_unit: e.target.value })}
                      className="cb-input"
                      placeholder="e.g. Rupees"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                      Word representing unit (Decimal)
                    </label>
                    <input
                      type="text"
                      value={form.currency_amount_words_decimal}
                      onChange={(e) => setForm({ ...form, currency_amount_words_decimal: e.target.value })}
                      className="cb-input"
                      placeholder="e.g. Paise"
                    />
                  </div>
                  
                  <div className="col-span-2 grid gap-3 sm:grid-cols-3 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.currency_show_in_millions}
                        onChange={(e) => setForm({ ...form, currency_show_in_millions: e.target.checked })}
                        className="h-4 w-4"
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Show in millions</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.currency_suffix_symbol}
                        onChange={(e) => setForm({ ...form, currency_suffix_symbol: e.target.checked })}
                        className="h-4 w-4"
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Suffix symbol</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.currency_space_between_amount_and_symbol}
                        onChange={(e) => setForm({ ...form, currency_space_between_amount_and_symbol: e.target.checked })}
                        className="h-4 w-4"
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Add space</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24, justifyContent: 'flex-end' }}>
              <button type="button" className="cb-btn-secondary" onClick={handleCloseForm}>Cancel</button>
              <button type="submit" className="cb-btn-primary" disabled={updateCompanyMutation.isPending}>
                <Save size={16} /> {updateCompanyMutation.isPending ? "Saving..." : "Save Currency"}
              </button>
            </div>
            {updateCompanyMutation.isError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                Could not update base currency settings.
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
