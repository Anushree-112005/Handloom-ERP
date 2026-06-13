import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { vouchers } from "../api";
import {
  ArrowLeft,
  Receipt,
  Search,
  Plus,
  Edit2,
  Check,
  X,
  Settings,
  ListFilter
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
  const [editingType, setEditingType] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

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

  const handleEditClick = (type) => {
    setEditingType({ ...type });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setTypes(types.map((t) => (t.name === editingType.name ? editingType : t)));
    setSuccessMsg(`Voucher type "${editingType.name}" updated successfully!`);
    setEditingType(null);
    setTimeout(() => setSuccessMsg(""), 3000);
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Voucher Types</h1>
            <p className="cb-page-subtitle">Configure numbering rules, printing defaults, and prefix configurations for vouchers</p>
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
            placeholder="Search voucher types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cb-input pl-9 text-xs py-1.5"
          />
        </div>
        {successMsg && (
          <span className="btn btn-success">
            <Check size={14} /> {successMsg}
          </span>
        )}
      </div>

      {/* List Table */}
      <div className="cb-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="btn btn-secondary">
              <tr>
                <th className="px-6 py-4 cb-th w-1/4">Voucher Type Name</th>
                <th className="px-6 py-4 cb-th">Base Type</th>
                <th className="px-6 py-4 cb-th">Numbering Method</th>
                <th className="px-6 py-4 cb-th">Prefix Prefix</th>
                <th className="px-6 py-4 cb-th text-center">Print Default</th>
                <th className="px-6 py-4 cb-th text-center">Vouchers Count</th>
                <th className="px-6 py-4 cb-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => (
                <tr key={idx} className="btn btn-secondary">
                  <td className="px-6 py-4 cb-td font-semibold text-purple-700">{item.name}</td>
                  <td className="px-6 py-4 cb-td">{item.baseType}</td>
                  <td className="px-6 py-4 cb-td">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      item.numbering === "Automatic"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {item.numbering}
                    </span>
                  </td>
                  <td className="px-6 py-4 cb-td font-mono text-xs">{item.prefix || "—"}</td>
                  <td className="px-6 py-4 cb-td text-center">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      item.printAfterSave 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-slate-50 text-slate-400 border border-slate-250"
                    }`}>
                      {item.printAfterSave ? "Print After Save" : "No Print"}
                    </span>
                  </td>
                  <td className="px-6 py-4 cb-td text-center font-bold text-slate-800">{getCount(item.name)}</td>
                  <td className="px-6 py-4 cb-td text-right">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="btn btn-primary"
                      title="Alter Configuration"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alter Voucher Type Modal */}
      {editingType && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingType(null)}
        >
          <form
            onSubmit={handleSave}
            className="card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="btn btn-secondary">
              <span className="text-sm font-semibold text-slate-800">Alter Voucher Type: {editingType.name}</span>
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="cb-label">Method of Voucher Numbering</span>
                <select
                  value={editingType.numbering}
                  onChange={(e) => setEditingType({ ...editingType, numbering: e.target.value })}
                  className="cb-input text-xs py-1.5 px-3"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                  <option value="None">None</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="cb-label">Voucher Prefix / Code</span>
                <input
                  type="text"
                  value={editingType.prefix}
                  onChange={(e) => setEditingType({ ...editingType, prefix: e.target.value })}
                  className="cb-input text-xs py-1.5 px-3 font-mono"
                  placeholder="e.g. INV/"
                />
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-2">
                <input
                  type="checkbox"
                  checked={editingType.printAfterSave}
                  onChange={(e) => setEditingType({ ...editingType, printAfterSave: e.target.checked })}
                  className="btn btn-secondary"
                />
                <span className="text-xs font-medium text-slate-600">Print voucher after saving</span>
              </label>
            </div>

            <div className="btn btn-secondary">
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="cb-btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cb-btn-primary text-xs py-1.5 px-3"
              >
                Save Alterations
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
