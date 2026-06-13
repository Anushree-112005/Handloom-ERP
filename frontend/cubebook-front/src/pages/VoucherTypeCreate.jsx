import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ArrowLeft, Save } from "lucide-react";

const BASE_VOUCHER_TYPES = [
  "Contra", "Payment", "Receipt", "Journal", "Sales", "Purchase", "Debit Note", "Credit Note"
];

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

export default function VoucherTypeCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    alias: "",
    baseType: "Payment",
    abbreviation: "",
    active: true,
    numbering: "Automatic",
    prefix: "",
    retainOriginal: true,
    effectiveDates: false,
    zeroValued: false,
    optionalDefault: false,
    allowNarration: true,
    ledgerNarrations: false,
    whatsappAfterSave: false,
    printAfterSave: false,
  });

  const handleChange = (key, val) => {
    setForm({ ...form, [key]: val });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;

    // Load existing mock voucher types or use default
    const saved = localStorage.getItem(MOCK_VOUCHER_TYPES_KEY);
    const existing = saved ? JSON.parse(saved) : DEFAULT_VOUCHER_TYPES;

    // Add new type
    const newType = {
      name: form.name,
      baseType: form.baseType,
      numbering: form.numbering,
      prefix: form.prefix || (form.name.substring(0, 3).toUpperCase() + "/"),
      printAfterSave: form.printAfterSave,
      active: form.active,
    };

    localStorage.setItem(MOCK_VOUCHER_TYPES_KEY, JSON.stringify([...existing, newType]));
    alert(`Voucher Type "${form.name}" created successfully!`);
    navigate("/masters/voucher-types"); // Navigate to list view
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Voucher Type Creation</h1>
            <p className="cb-page-subtitle">Define a new custom transaction voucher type with custom numbering and rules</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cb-btn-secondary"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: General Configuration (8 cols) */}
        <div className="lg:col-span-8 cb-card p-6 space-y-6 bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">General Settings</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Voucher Type Name *</span>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="cb-input"
                placeholder="e.g. Tax Invoice, Cash Payment"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">(alias)</span>
              <input
                type="text"
                value={form.alias}
                onChange={(e) => handleChange("alias", e.target.value)}
                className="cb-input"
                placeholder="Alternative abbreviation name"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Select Type of Voucher *</span>
              <select
                value={form.baseType}
                onChange={(e) => handleChange("baseType", e.target.value)}
                className="cb-input"
              >
                {BASE_VOUCHER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Abbreviation</span>
              <input
                type="text"
                value={form.abbreviation}
                onChange={(e) => handleChange("abbreviation", e.target.value)}
                className="cb-input"
                placeholder="e.g. TxInv"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Method of Voucher Numbering</span>
              <select
                value={form.numbering}
                onChange={(e) => handleChange("numbering", e.target.value)}
                className="cb-input"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="None">None</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Voucher Prefix</span>
              <input
                type="text"
                value={form.prefix}
                onChange={(e) => handleChange("prefix", e.target.value)}
                className="cb-input font-mono"
                placeholder="e.g. TI/"
              />
            </label>
          </div>

          <div className="border-t border-slate-100 pt-4 grid gap-4 sm:grid-cols-2">
            <span className="cb-label sm:col-span-2 block mb-1">Voucher Processing Rules</span>
            
            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">Activate this Voucher Type</span>
              <select
                value={form.active ? "Yes" : "No"}
                onChange={(e) => handleChange("active", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">Allow narration in voucher</span>
              <select
                value={form.allowNarration ? "Yes" : "No"}
                onChange={(e) => handleChange("allowNarration", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">Allow zero-valued transactions</span>
              <select
                value={form.zeroValued ? "Yes" : "No"}
                onChange={(e) => handleChange("zeroValued", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">Make 'Optional' by default</span>
              <select
                value={form.optionalDefault ? "Yes" : "No"}
                onChange={(e) => handleChange("optionalDefault", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">Use effective dates</span>
              <select
                value={form.effectiveDates ? "Yes" : "No"}
                onChange={(e) => handleChange("effectiveDates", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">Provide ledger narrations</span>
              <select
                value={form.ledgerNarrations ? "Yes" : "No"}
                onChange={(e) => handleChange("ledgerNarrations", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>
          </div>
        </div>

        {/* Right Column: Printing & Communication (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="cb-card p-6 bg-white space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">Printing & Output</h3>
            
            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">Print voucher after save</span>
              <select
                value={form.printAfterSave ? "Yes" : "No"}
                onChange={(e) => handleChange("printAfterSave", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-slate-600">WhatsApp after save</span>
              <select
                value={form.whatsappAfterSave ? "Yes" : "No"}
                onChange={(e) => handleChange("whatsappAfterSave", e.target.value === "Yes")}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>
          </div>

          <div className="cb-card p-6 bg-slate-50/50 flex flex-col justify-between">
            <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <span className="cb-label block mb-1">Configuration Note</span>
              <p>Defining a custom prefix formats voucher numbers dynamically (e.g., invoice sequences like SLS/001, SLS/002).</p>
            </div>
            
            <div className="pt-6 flex items-center gap-3 justify-end border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="cb-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cb-btn-primary"
              >
                <Save size={15} />
                Accept
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
