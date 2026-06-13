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
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <FileText size={20} className="text-white" />
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
        <div className="btn btn-success">
          <span className="font-bold">Success:</span> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: HSN/SAC & GST Rates (6 cols) */}
        <div className="lg:col-span-6 cb-card p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <h3 className="btn btn-secondary">HSN/SAC & Related Details</h3>
            
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

          <div className="btn btn-secondary">
            <h3 className="btn btn-secondary">GST Rate & Related Details</h3>

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
        <div className="lg:col-span-6 cb-card p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <h3 className="btn btn-secondary">e-Way Bill Details</h3>

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

          <div className="btn btn-secondary">
            <h3 className="btn btn-secondary">Additional Configuration</h3>

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

          <div className="btn btn-secondary">
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
      </form>
    </div>
  );
}
