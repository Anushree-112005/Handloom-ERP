import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCompanyStore from "../store/companyStore";
import { FileText, ArrowLeft, Save } from "lucide-react";

const STATUTORY_KEY = (companyId) => `cb_company_statutory_${companyId}`;

export default function CompanyGstDetails() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    hsnSacDetails: "Not Defined",
    hsnSac: "",
    description: "",
    gstRateDetails: "Not Defined",
    taxabilityType: "Taxable",
    gstRate: 18,
    interstateThreshold: 50000,
    intrastateThreshold: 50000,
    thresholdIncludes: "Value of Invoice",
    hsnSummaryFor: "All Sections",
    minHsnLength: 4,
    showGstAdvances: false,
    updateGstStatus: false,
    setDownloadDetails: false
  });

  useEffect(() => {
    if (activeCompany) {
      const saved = localStorage.getItem(STATUTORY_KEY(activeCompany.id));
      if (saved) {
        const data = JSON.parse(saved);
        setForm(prev => ({ ...prev, ...data.gstDetails }));
      } else if (activeCompany.gstin) {
        // Fallback or seed some info if company already has gstin
        setForm(prev => ({ ...prev, description: "GST Details for " + activeCompany.name }));
      }
    }
  }, [activeCompany]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeCompany) return;

    // Load existing statutory config
    const saved = localStorage.getItem(STATUTORY_KEY(activeCompany.id));
    const config = saved ? JSON.parse(saved) : { gstDetails: {}, panCinDetails: {} };

    // Update gstDetails
    config.gstDetails = form;
    localStorage.setItem(STATUTORY_KEY(activeCompany.id), JSON.stringify(config));

    setSuccessMsg("Company GST details updated successfully!");
    setTimeout(() => {
      setSuccessMsg("");
      navigate("/masters");
    }, 2000);
  };

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <FileText size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to configure GST.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-all duration-300">
            <FileText size={24} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Company GST Details</h1>
            <p className="cb-page-subtitle">Configure GST Rates, HSN/SAC codes, Taxability rules and e-Way bill threshold limits</p>
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

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="font-bold">Success:</span> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: HSN/SAC & GST Rates (6 cols) */}
        <div className="lg:col-span-6 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-6 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">HSN/SAC & Related Details</h3>
            </div>
            
            <label className="flex flex-col gap-1.5">
              <span className="cb-label">HSN/SAC Details Option</span>
              <select
                value={form.hsnSacDetails}
                onChange={(e) => handleChange("hsnSacDetails", e.target.value)}
                className="cb-input"
              >
                <option value="Not Defined">Not Defined</option>
                <option value="Specify Details Here">Specify Details Here</option>
                <option value="Use GST Classification">Use GST Classification</option>
              </select>
            </label>

            {form.hsnSacDetails === "Specify Details Here" && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">HSN/SAC Code</span>
                  <input
                    type="text"
                    value={form.hsnSac}
                    onChange={(e) => handleChange("hsnSac", e.target.value)}
                    className="cb-input font-mono"
                    placeholder="e.g. 5208"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">HSN/SAC Description</span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="cb-input"
                    placeholder="e.g. Cotton Fabrics"
                  />
                </label>
              </>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100/50">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-6 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">GST Rate & Related Details</h3>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">GST Rate Details Option</span>
              <select
                value={form.gstRateDetails}
                onChange={(e) => handleChange("gstRateDetails", e.target.value)}
                className="cb-input"
              >
                <option value="Not Defined">Not Defined</option>
                <option value="Specify Details Here">Specify Details Here</option>
              </select>
            </label>

            {form.gstRateDetails === "Specify Details Here" && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">Taxability Type</span>
                  <select
                    value={form.taxabilityType}
                    onChange={(e) => handleChange("taxabilityType", e.target.value)}
                    className="cb-input font-semibold"
                  >
                    <option value="Taxable">Taxable</option>
                    <option value="Nil Rated">Nil Rated</option>
                    <option value="Exempt">Exempt</option>
                  </select>
                </label>

                {form.taxabilityType === "Taxable" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="cb-label">GST Rate (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.gstRate}
                      onChange={(e) => handleChange("gstRate", Number(e.target.value))}
                      className="cb-input font-mono"
                    />
                  </label>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: e-Way Bill & Configurations (6 cols) */}
        <div className="lg:col-span-6 bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-6 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">e-Way Bill Details</h3>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Interstate Threshold Limit (₹)</span>
              <input
                type="number"
                value={form.interstateThreshold}
                onChange={(e) => handleChange("interstateThreshold", Number(e.target.value))}
                className="cb-input font-mono"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Intrastate Threshold Limit (₹)</span>
              <input
                type="number"
                value={form.intrastateThreshold}
                onChange={(e) => handleChange("intrastateThreshold", Number(e.target.value))}
                className="cb-input font-mono"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Threshold Limit Includes</span>
              <select
                value={form.thresholdIncludes}
                onChange={(e) => handleChange("thresholdIncludes", e.target.value)}
                className="cb-input font-semibold"
              >
                <option value="Value of Invoice">Value of Invoice</option>
                <option value="Taxable Value">Taxable Value</option>
                <option value="Taxable and Exempt Value">Taxable and Exempt Value</option>
              </select>
            </label>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100/50">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-6 w-1.5 bg-gradient-to-b from-rose-400 to-pink-500 rounded-full"></div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Additional Configuration</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-slate-500">Show GST Advances</span>
                <select
                  value={form.showGstAdvances ? "Yes" : "No"}
                  onChange={(e) => handleChange("showGstAdvances", e.target.value === "Yes")}
                  className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>

              <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-slate-500">Update GST Status</span>
                <select
                  value={form.updateGstStatus ? "Yes" : "No"}
                  onChange={(e) => handleChange("updateGstStatus", e.target.value === "Yes")}
                  className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
              
              <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer sm:col-span-2">
                <span className="text-[11px] font-semibold text-slate-500">Set/Alter details for downloading GST Returns</span>
                <select
                  value={form.setDownloadDetails ? "Yes" : "No"}
                  onChange={(e) => handleChange("setDownloadDetails", e.target.value === "Yes")}
                  className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100/50 flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Save size={15} />
              Accept
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
