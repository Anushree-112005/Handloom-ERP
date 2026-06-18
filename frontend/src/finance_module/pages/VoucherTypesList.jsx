import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { vouchers } from "../api";
import {
  Receipt,
  Search,
  Plus,
  Edit2,
  Check,
  X,
  ArrowLeft,
  Database,
  Save
} from "lucide-react";

const MOCK_VOUCHER_TYPES_KEY = "cb_mock_voucher_types";

const DEFAULT_VOUCHER_TYPES = [
  { name: "Payment", baseType: "Payment", numbering: "Automatic", prefix: "PMT/", printAfterSave: false, active: true },
  { name: "Receipt", baseType: "Receipt", numbering: "Automatic", prefix: "RCT/", printAfterSave: false, active: true },
  { name: "Journal", baseType: "Journal", numbering: "Automatic", prefix: "JNL/", printAfterSave: false, active: true },
  { name: "Sales", baseType: "Sales", numbering: "Automatic", prefix: "SLS/", printAfterSave: true, active: true },
  { name: "Purchase", baseType: "Purchase", numbering: "Automatic", prefix: "PUR/", printAfterSave: true, active: true },
  { name: "Contra", baseType: "Contra", numbering: "Automatic", prefix: "CON/", printAfterSave: false, active: true },
  { name: "Debit Note", baseType: "Debit Note", numbering: "Manual", prefix: "DN/", printAfterSave: false, active: true },
  { name: "Credit Note", baseType: "Credit Note", numbering: "Manual", prefix: "CN/", printAfterSave: false, active: true },
];

export default function VoucherTypesList() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();
  const [search, setSearch] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    baseType: 'Journal',
    numbering: 'Automatic',
    prefix: '',
    printAfterSave: false,
    active: true
  });

  const [types, setTypes] = useState(() => {
    const saved = localStorage.getItem(MOCK_VOUCHER_TYPES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_VOUCHER_TYPES;
  });

  useEffect(() => {
    localStorage.setItem(MOCK_VOUCHER_TYPES_KEY, JSON.stringify(types));
  }, [types]);

  // Fetch actual vouchers to show live counters
  const { data: vouchersList = [], isLoading } = useQuery({
    queryKey: ["vouchers", activeCompany?.id],
    queryFn: () => vouchers.list({ company_id: activeCompany.id }),
    enabled: !!activeCompany,
  });

  const getCount = (typeName) => {
    return vouchersList.filter((v) => v.voucher_type === typeName).length;
  };

  const handleNew = () => {
    setForm({
      name: '',
      baseType: 'Journal',
      numbering: 'Automatic',
      prefix: '',
      printAfterSave: false,
      active: true
    });
    setEditingType(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (type) => {
    setForm({ ...type });
    setEditingType(type.name);
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingType) {
      setTypes(types.map((t) => (t.name === editingType ? form : t)));
    } else {
      setTypes([...types, form]);
    }
    
    setIsFormOpen(false);
    setEditingType(null);
  };

  const filtered = types.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.baseType.toLowerCase().includes(search.toLowerCase())
  );

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Receipt size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to view voucher types.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Receipt size={24} color="var(--primary)" />
            Voucher Types
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Configure numbering rules and prefixes for vouchers</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={handleNew}
          >
            <Plus size={16} /> New Type
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
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
                <Receipt size={24} />
              </div>
              <div className="stat-info">
                <p>Total Types</p>
                <h3>{types.length}</h3>
              </div>
            </div>
            <div className="card stat-card" style={{ '--stat-color': '#10b981' }}>
              <div className="stat-icon emerald">
                <Check size={24} />
              </div>
              <div className="stat-info">
                <p>Automatic Numbering</p>
                <h3>{types.filter(t => t.numbering === 'Automatic').length}</h3>
              </div>
            </div>
            <div className="card stat-card" style={{ '--stat-color': '#f59e0b' }}>
              <div className="stat-icon amber">
                <Edit2 size={24} />
              </div>
              <div className="stat-info">
                <p>Manual Numbering</p>
                <h3>{types.filter(t => t.numbering === 'Manual').length}</h3>
              </div>
            </div>
          </div>

          <div className="cb-card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Records ({filtered.length})</h3>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search types..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            <div className="table-responsive" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th className="cb-th w-1/4">Voucher Type Name</th>
                    <th className="cb-th">Base Type</th>
                    <th className="cb-th">Numbering Method</th>
                    <th className="cb-th">Prefix</th>
                    <th className="cb-th text-center">Print Default</th>
                    <th className="cb-th text-center">Vouchers Count</th>
                    <th className="cb-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="cb-td font-semibold" style={{ color: 'var(--primary)' }}>{item.name}</td>
                      <td className="cb-td">{item.baseType}</td>
                      <td className="cb-td">
                        <span className="cb-badge bg-slate-100 text-slate-700 border border-slate-200">
                          {item.numbering}
                        </span>
                      </td>
                      <td className="cb-td font-mono text-xs">{item.prefix || "—"}</td>
                      <td className="cb-td text-center">
                        <span className={`cb-badge ${item.printAfterSave ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                          {item.printAfterSave ? "Print" : "No Print"}
                        </span>
                      </td>
                      <td className="cb-td text-center font-bold text-slate-800">{getCount(item.name)}</td>
                      <td className="cb-td text-right">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
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
                <Receipt size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editingType ? 'Edit Type' : 'New Type'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Voucher Type Details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ padding: 24 }}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="cb-input"
                  placeholder="e.g. Sales Invoice"
                  disabled={!!editingType}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Select Type of Voucher <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  value={form.baseType} 
                  onChange={(e) => setForm({...form, baseType: e.target.value})} 
                  className="cb-input"
                  disabled={!!editingType}
                >
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Journal">Journal</option>
                  <option value="Sales">Sales</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Contra">Contra</option>
                  <option value="Debit Note">Debit Note</option>
                  <option value="Credit Note">Credit Note</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Method of Voucher Numbering
                </label>
                <select 
                  value={form.numbering} 
                  onChange={(e) => setForm({...form, numbering: e.target.value})} 
                  className="cb-input"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Voucher Prefix
                </label>
                <input
                  type="text"
                  value={form.prefix}
                  onChange={(e) => setForm({...form, prefix: e.target.value})}
                  className="cb-input font-mono"
                  placeholder="e.g. INV/"
                />
              </div>

              <div className="col-span-2 form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={form.printAfterSave}
                  onChange={(e) => setForm({...form, printAfterSave: e.target.checked})}
                  className="h-4 w-4"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Print voucher after saving
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24 }}>
              <button type="button" className="cb-btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="cb-btn-primary">
                <Save size={16} /> Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
