import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useCompanyStore from "../store/companyStore";
import { 
  Building, 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  Sliders,
  Sparkles,
  Link2
} from "lucide-react";

const FEATURES_KEY = (companyId) => `cb_company_features_${companyId}`;

const initialFeaturesState = {
  showMoreFeatures: "No",
  showAllFeatures: "No",
  
  // Accounting
  maintainAccounts: "Yes",
  enableBillWise: "Yes",
  enableCostCentres: "No",
  enableInterestCalc: "No", // visible only if showAllFeatures === 'Yes'
  
  // Inventory
  maintainInventory: "Yes",
  integrateAccountsInventory: "Yes",
  enablePriceLevels: "No",
  enableBatches: "No",
  maintainExpiryBatches: "No",
  useDiscountColumn: "No",
  useActualBilledQty: "No",
  
  // Taxation
  enableGst: "Yes",
  alterGstDetails: "No",
  enableTds: "No",
  enableTcs: "No",
  
  // Online Access
  enableBrowserAccess: "Yes",
  enableTallyNet: "No",
  
  // Others
  enablePaymentRequest: "No",
  enableMultipleAddresses: "No",
  markModifiedVouchers: "No"
};

export default function CompanyFeatures() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeCompany, setCompany } = useCompanyStore();
  const companyId = activeCompany?.id;

  const isCreatedFlow = searchParams.get("created") === "true";
  const [successMsg, setSuccessMsg] = useState("");
  const [features, setFeatures] = useState(initialFeaturesState);

  // 1. Load features from local storage
  useEffect(() => {
    if (companyId) {
      const saved = localStorage.getItem(FEATURES_KEY(companyId));
      if (saved) {
        setFeatures(JSON.parse(saved));
      } else {
        // Default seed based on active company
        setFeatures(prev => ({
          ...prev,
          maintainInventory: activeCompany.maintain_inventory ? "Yes" : "No"
        }));
      }
    }
  }, [companyId, activeCompany]);

  const handleChange = (key, val) => {
    setFeatures(prev => {
      const next = { ...prev, [key]: val };
      
      // Auto-toggle dependent rules
      if (key === "showMoreFeatures" && val === "No") {
        next.showAllFeatures = "No";
      }
      if (key === "maintainInventory" && val === "No") {
        next.integrateAccountsInventory = "No";
      }
      if (key === "enableBatches" && val === "No") {
        next.maintainExpiryBatches = "No";
      }
      
      return next;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!companyId) return;

    // Save to local storage
    localStorage.setItem(FEATURES_KEY(companyId), JSON.stringify(features));

    // Update company store maintain_inventory attribute if altered
    if (activeCompany) {
      const updatedCompany = {
        ...activeCompany,
        maintain_inventory: features.maintainInventory === "Yes"
      };
      setCompany(updatedCompany);
    }

    setSuccessMsg("Company features updated successfully!");

    // If they selected Yes to alter GST details, redirect to GST Registration
    setTimeout(() => {
      setSuccessMsg("");
      if (features.alterGstDetails === "Yes") {
        navigate("/cubebook/masters/gst-registration");
      } else {
        navigate("/cubebook/dashboard");
      }
    }, 1500);
  };

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Sliders size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to configure features.</p>
        </div>
      </div>
    );
  }

  const showMore = features.showMoreFeatures === "Yes";
  const showAll = features.showAllFeatures === "Yes";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* ── Redirection Header / Success Banner ── */}
      {isCreatedFlow && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-600/10 space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-purple-200" />
            </div>
            <h2 className="text-[16px] font-bold">Company created successfully.</h2>
          </div>
          <p className="text-xs text-purple-100 font-medium">
            Configure the features below to match your business workflows and bookkeeping needs.
          </p>
        </div>
      )}

      {/* ── Title Banner ── */}
      {!isCreatedFlow && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
              <Sliders size={20} className="text-white" />
            </div>
            <div>
              <h1 className="cb-page-title">Company Features Alteration</h1>
              <p className="cb-page-subtitle">Enable or disable accounting, inventory, and taxation features for {activeCompany.name}</p>
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
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="font-bold">Success:</span> {successMsg}
        </div>
      )}

      {/* ── Configuration Form ── */}
      <form onSubmit={handleSave} className="cb-card bg-white p-6 space-y-6">
        
        {/* Top Feature Toggles */}
        <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
          <label className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200/50 shadow-sm cursor-pointer">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Show more features</span>
            <select
              value={features.showMoreFeatures}
              onChange={(e) => handleChange("showMoreFeatures", e.target.value)}
              className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>

          {showMore && (
            <label className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200/50 shadow-sm cursor-pointer animate-in fade-in slide-in-from-left-2 duration-150">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Show all features</span>
              <select
                value={features.showAllFeatures}
                onChange={(e) => handleChange("showAllFeatures", e.target.value)}
                className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </label>
          )}
        </div>

        {/* Feature Grid Columns */}
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* LEFT COLUMN: Accounting & Inventory */}
          <div className="space-y-6">
            
            {/* Accounting */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Accounting</h3>
              
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-medium text-slate-700">Maintain Accounts</span>
                  <select
                    value={features.maintainAccounts}
                    onChange={(e) => handleChange("maintainAccounts", e.target.value)}
                    className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-medium text-slate-700">Enable Bill-wise entry</span>
                  <select
                    value={features.enableBillWise}
                    onChange={(e) => handleChange("enableBillWise", e.target.value)}
                    className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {showMore && (
                  <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                    <span className="text-[13px] font-medium text-slate-700">Enable Cost Centres</span>
                    <select
                      value={features.enableCostCentres}
                      onChange={(e) => handleChange("enableCostCentres", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                )}

                {showAll && (
                  <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                    <span className="text-[13px] font-medium text-slate-700">Enable Interest Calculation</span>
                    <select
                      value={features.enableInterestCalc}
                      onChange={(e) => handleChange("enableInterestCalc", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Inventory</h3>

              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-medium text-slate-700">Maintain Inventory</span>
                  <select
                    value={features.maintainInventory}
                    onChange={(e) => handleChange("maintainInventory", e.target.value)}
                    className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {features.maintainInventory === "Yes" && (
                  <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                    <span className="text-[13px] font-medium text-slate-700">Integrate Accounts with Inventory</span>
                    <select
                      value={features.integrateAccountsInventory}
                      onChange={(e) => handleChange("integrateAccountsInventory", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                )}

                {showMore && features.maintainInventory === "Yes" && (
                  <>
                    <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                      <span className="text-[13px] font-medium text-slate-700">Enable multiple Price Levels</span>
                      <select
                        value={features.enablePriceLevels}
                        onChange={(e) => handleChange("enablePriceLevels", e.target.value)}
                        className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                      <span className="text-[13px] font-medium text-slate-700">Enable Batches</span>
                      <select
                        value={features.enableBatches}
                        onChange={(e) => handleChange("enableBatches", e.target.value)}
                        className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    {features.enableBatches === "Yes" && (
                      <div className="flex items-center justify-between py-2 pl-4 animate-in fade-in duration-100">
                        <span className="text-[13px] font-medium text-slate-600">Maintain Expiry Date for Batches</span>
                        <select
                          value={features.maintainExpiryBatches}
                          onChange={(e) => handleChange("maintainExpiryBatches", e.target.value)}
                          className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                      <span className="text-[13px] font-medium text-slate-700">Use Discount column in invoices</span>
                      <select
                        value={features.useDiscountColumn}
                        onChange={(e) => handleChange("useDiscountColumn", e.target.value)}
                        className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                      <span className="text-[13px] font-medium text-slate-700">Use separate Actual and Billed Quantity columns</span>
                      <select
                        value={features.useActualBilledQty}
                        onChange={(e) => handleChange("useActualBilledQty", e.target.value)}
                        className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Taxation, Online Access & Others */}
          <div className="space-y-6">
            
            {/* Taxation */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Taxation</h3>

              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-medium text-slate-700">Enable Goods and Services Tax (GST)</span>
                  <select
                    value={features.enableGst}
                    onChange={(e) => handleChange("enableGst", e.target.value)}
                    className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-medium text-slate-700">Set/Alter Company GST Rate and Other Details</span>
                  <select
                    value={features.alterGstDetails}
                    onChange={(e) => handleChange("alterGstDetails", e.target.value)}
                    className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-medium text-slate-700">Enable Tax Deductible at Source (TDS)</span>
                  <select
                    value={features.enableTds}
                    onChange={(e) => handleChange("enableTds", e.target.value)}
                    className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {showMore && (
                  <div className="flex items-center justify-between py-2 animate-in fade-in duration-100">
                    <span className="text-[13px] font-medium text-slate-700">Enable Tax Collected at Source (TCS)</span>
                    <select
                      value={features.enableTcs}
                      onChange={(e) => handleChange("enableTcs", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Online Access */}
            {showMore && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Online Access</h3>

                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium text-slate-700">Enable Browser Access for Reports</span>
                    <select
                      value={features.enableBrowserAccess}
                      onChange={(e) => handleChange("enableBrowserAccess", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium text-slate-700">Enable Tally.NET Services for Remote Access</span>
                    <select
                      value={features.enableTallyNet}
                      onChange={(e) => handleChange("enableTallyNet", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Others */}
            {showMore && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Others</h3>

                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium text-slate-700">Enable Payment Request to share link/QR code</span>
                    <select
                      value={features.enablePaymentRequest}
                      onChange={(e) => handleChange("enablePaymentRequest", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium text-slate-700">Enable multiple addresses</span>
                    <select
                      value={features.enableMultipleAddresses}
                      onChange={(e) => handleChange("enableMultipleAddresses", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] font-medium text-slate-700">Mark modified vouchers</span>
                    <select
                      value={features.markModifiedVouchers}
                      onChange={(e) => handleChange("markModifiedVouchers", e.target.value)}
                      className="font-bold text-xs text-purple-700 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Form Footer Actions */}
        <div className="pt-6 border-t border-slate-100 flex justify-between items-center gap-3">
          <div className="text-xs text-slate-400 font-medium">
            Active Company: <span className="text-slate-700 font-semibold">{activeCompany.name}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/cubebook/dashboard")}
              className="cb-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cb-btn-primary"
            >
              <Save size={15} />
              Accept / Save
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
