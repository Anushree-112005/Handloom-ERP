import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useCompanyStore from "../store/companyStore";
import { 
  FileText, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertCircle,
  Building,
  HelpCircle,
  ChevronRight,
  Search
} from "lucide-react";

const INDIAN_STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"], ["24", "Gujarat"], ["27", "Maharashtra"],
  ["29", "Karnataka"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["19", "West Bengal"],
];

const getStateName = (code) => {
  const found = INDIAN_STATES.find(s => s[0] === code);
  return found ? found[1] : (code || "Not Defined");
};

const REG_KEY = (companyId) => `cb_company_gst_registrations_${companyId}`;

const initialFormState = {
  status: "Active",
  stateCode: "",
  registrationType: "Regular",
  assesseeOfOtherTerritory: "No",
  gstin: "",
  periodicityGstr1: "Monthly",
  gstUsername: "",
  modeOfFiling: "Not Applicable",
  eInvoicingApplicable: "No",
  eWayBillApplicable: "Yes",
  applicableFrom: "2026-04-01",
  applicableForIntrastate: "Yes"
};

export default function GstRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeCompany } = useCompanyStore();
  const companyId = activeCompany?.id;

  const [registrations, setRegistrations] = useState([]);
  const [viewMode, setViewMode] = useState("prompt"); // 'prompt' | 'list' | 'create' | 'alter'
  const [selectedRegId, setSelectedRegId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [form, setForm] = useState(initialFormState);

  // 1. Load registrations from local storage on mount
  useEffect(() => {
    if (companyId) {
      const saved = localStorage.getItem(REG_KEY(companyId));
      const list = saved ? JSON.parse(saved) : [];
      setRegistrations(list);

      // Determine initial viewMode based on route query param and list state
      const urlMode = searchParams.get("mode");
      if (urlMode === "alter") {
        if (list.length === 0) {
          setViewMode("list"); // will show empty state
        } else if (list.length === 1) {
          setSelectedRegId(list[0].id);
          setForm(list[0]);
          setViewMode("alter");
        } else {
          setViewMode("list");
        }
      } else {
        // Master Creation route entry
        if (list.length === 0) {
          setViewMode("create");
          setForm({ ...initialFormState, stateCode: activeCompany.state_code || "" });
        } else {
          setViewMode("prompt");
        }
      }
    }
  }, [companyId, searchParams, activeCompany]);

  // 2. Keyboard shortcuts handler for exist-check prompt modal
  useEffect(() => {
    if (viewMode !== "prompt") return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === "c") {
        // C: Create New
        handleCreateNew();
      } else if (key === "a") {
        // A: Alter Existing
        handleAlterSelect();
      } else if (key === "q" || e.key === "Escape") {
        // Q or Escape: Quit
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, registrations]);

  // Actions
  const handleCreateNew = () => {
    setForm({ ...initialFormState, stateCode: activeCompany?.state_code || "" });
    setViewMode("create");
  };

  const handleAlterSelect = () => {
    if (registrations.length === 1) {
      setSelectedRegId(registrations[0].id);
      setForm(registrations[0]);
      setViewMode("alter");
    } else {
      setViewMode("list");
    }
  };

  const handleSelectReg = (reg) => {
    setSelectedRegId(reg.id);
    setForm(reg);
    setViewMode("alter");
  };

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const validateForm = () => {
    if (!form.stateCode) {
      setErrorMsg("Please select a State.");
      return false;
    }
    if (!form.gstin.trim()) {
      setErrorMsg("GSTIN/UIN is required.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    let updatedList = [];
    if (viewMode === "create") {
      const newReg = {
        ...form,
        id: "reg_" + Date.now()
      };
      updatedList = [...registrations, newReg];
      setSuccessMsg("GST Registration created successfully!");
    } else if (viewMode === "alter") {
      updatedList = registrations.map(item => 
        item.id === selectedRegId ? { ...form, id: selectedRegId } : item
      );
      setSuccessMsg("GST Registration updated successfully!");
    }

    localStorage.setItem(REG_KEY(companyId), JSON.stringify(updatedList));
    setRegistrations(updatedList);

    setTimeout(() => {
      setSuccessMsg("");
      // Go back to listing or dashboard
      if (updatedList.length > 1) {
        setViewMode("list");
      } else {
        navigate("/masters");
      }
    }, 1500);
  };

  const handleDelete = () => {
    const updatedList = registrations.filter(item => item.id !== selectedRegId);
    localStorage.setItem(REG_KEY(companyId), JSON.stringify(updatedList));
    setRegistrations(updatedList);
    setShowConfirmDelete(false);
    setSuccessMsg("GST Registration deleted successfully.");

    setTimeout(() => {
      setSuccessMsg("");
      if (updatedList.length > 0) {
        setViewMode("list");
      } else {
        navigate("/masters");
      }
    }, 1500);
  };

  // Filter list of registrations
  const filteredRegs = registrations.filter(reg => 
    getStateName(reg.stateCode).toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.gstin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <FileText size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to access GST Registrations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header (Only visible if not in prompt dialog mode) ── */}
      {viewMode !== "prompt" && (
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="btn btn-primary">
              <Building size={20} className="text-white" />
            </div>
            <div>
              <h1 className="cb-page-title">
                {viewMode === "create" && "GST Registration Creation"}
                {viewMode === "alter" && "GST Registration Alteration"}
                {viewMode === "list" && "GST Registrations List"}
              </h1>
              <p className="cb-page-subtitle">
                {viewMode === "create" && "Establish new state-level GST details for company statutory billing"}
                {viewMode === "alter" && `Modify GST profile for state: ${getStateName(form.stateCode)}`}
                {viewMode === "list" && "Browse and select profiles to alter or add new registrations"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (viewMode === "create" && registrations.length > 0) {
                setViewMode("prompt");
              } else if (viewMode === "alter" && registrations.length > 1) {
                setViewMode("list");
              } else {
                navigate("/masters");
              }
            }}
            className="cb-btn-secondary"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        </div>
      )}

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="btn btn-success">
          <span className="font-bold">Success:</span> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="btn btn-danger">
          <span className="font-bold">Error:</span> {errorMsg}
        </div>
      )}

      {/* ── 1. PROMPT DIALOG MODE (Exist Check UI) ── */}
      {viewMode === "prompt" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-500 border border-amber-100">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">GST Registration Already Exists</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  GST Registration already exists for this Company. Do you want to alter the existing GST Registration or create a new GST Registration?
                </p>
              </div>
            </div>
            
            <div className="btn btn-secondary">
              <button
                type="button"
                onClick={handleCreateNew}
                className="form-control"
              >
                <kbd className="card">C</kbd>
                Create New
              </button>
              <button
                type="button"
                onClick={handleAlterSelect}
                className="form-control"
              >
                <kbd className="card">A</kbd>
                Alter Existing
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="form-control"
              >
                <kbd className="btn btn-secondary">Q</kbd>
                Quit / Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. LIST MODE (Select Profile for Alteration) ── */}
      {viewMode === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search state or GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cb-input pl-10"
              />
            </div>
            
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full sm:w-auto cb-btn-primary flex items-center justify-center"
            >
              <Plus size={16} />
              Add Registration
            </button>
          </div>

          {filteredRegs.length === 0 ? (
            <div className="cb-card p-12 text-center text-slate-400">
              <FileText className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm font-semibold">No GST registrations found</p>
              <p className="text-xs text-slate-400 mt-1">Add state registrations to enable multi-state statutory invoicing.</p>
            </div>
          ) : (
            <div className="cb-card divide-y divide-slate-100 bg-white">
              {filteredRegs.map((reg) => (
                <div 
                  key={reg.id} 
                  className="btn btn-secondary"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                        {getStateName(reg.stateCode)}
                      </span>
                      <span className={`cb-badge ${
                        reg.status === "Active" 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {reg.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">({reg.registrationType})</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>GSTIN: <span className="font-mono font-semibold text-slate-600">{reg.gstin}</span></span>
                      <span>•</span>
                      <span>Username: <span className="font-semibold text-slate-600">{reg.gstUsername || "None"}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSelectReg(reg)}
                      className="btn btn-primary"
                      title="Edit Registration"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRegId(reg.id);
                        setShowConfirmDelete(true);
                      }}
                      className="btn btn-danger"
                      title="Delete Registration"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. FORM MODE (Create / Alter Screen) ── */}
      {(viewMode === "create" || viewMode === "alter") && (
        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Left Column (Statutory details) */}
          <div className="lg:col-span-6 cb-card p-6 space-y-6 bg-white">
            
            {/* Status Info */}
            <div className="space-y-4">
              <div className="btn btn-secondary">
                <CheckCircle size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Statutory Status</h3>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Registration status</span>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="cb-input"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            {/* GST Registration Details */}
            <div className="btn btn-secondary">
              <div className="btn btn-secondary">
                <Building size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">GST Registration Details</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">State</span>
                  <select
                    value={form.stateCode}
                    onChange={(e) => handleChange("stateCode", e.target.value)}
                    className="cb-input"
                    disabled={viewMode === "alter"} // Prevent state alteration directly once created
                  >
                    <option value="">-- Select State --</option>
                    {INDIAN_STATES.map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">Registration type</span>
                  <select
                    value={form.registrationType}
                    onChange={(e) => handleChange("registrationType", e.target.value)}
                    className="cb-input"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer">
                  <span className="text-[11px] font-semibold text-slate-500">Assessee of Other Territory</span>
                  <select
                    value={form.assesseeOfOtherTerritory}
                    onChange={(e) => handleChange("assesseeOfOtherTerritory", e.target.value)}
                    className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="cb-label font-bold">GSTIN/UIN</span>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                    className="cb-input font-mono font-semibold"
                    placeholder="e.g. 33AAAAA0000A1Z2"
                    maxLength={15}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Periodicity of GSTR-1</span>
                <select
                  value={form.periodicityGstr1}
                  onChange={(e) => handleChange("periodicityGstr1", e.target.value)}
                  className="cb-input"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </label>
            </div>

            {/* Connected Details */}
            <div className="btn btn-secondary">
              <div className="btn btn-secondary">
                <HelpCircle size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected GST Details</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">GST Username</span>
                  <input
                    type="text"
                    value={form.gstUsername}
                    onChange={(e) => handleChange("gstUsername", e.target.value)}
                    className="cb-input"
                    placeholder="Portal Username"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">Mode of Filing</span>
                  <select
                    value={form.modeOfFiling}
                    onChange={(e) => handleChange("modeOfFiling", e.target.value)}
                    className="cb-input"
                  >
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="API">API Linkage</option>
                    <option value="Offline">Offline JSON Utilities</option>
                  </select>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column (e-Way & e-Invoicing Details) */}
          <div className="lg:col-span-6 cb-card p-6 space-y-6 bg-white">
            
            {/* e-Way Bill Details */}
            <div className="space-y-4">
              <div className="btn btn-secondary">
                <FileText size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">e-Way Bill Details</h3>
              </div>

              <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-slate-500">e-Way Bill applicable</span>
                <select
                  value={form.eWayBillApplicable}
                  onChange={(e) => handleChange("eWayBillApplicable", e.target.value)}
                  className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>

              {form.eWayBillApplicable === "Yes" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="cb-label">Applicable from</span>
                    <input
                      type="date"
                      value={form.applicableFrom}
                      onChange={(e) => handleChange("applicableFrom", e.target.value)}
                      className="cb-input"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
                    <span className="text-[11px] font-semibold text-slate-500">Applicable for intrastate</span>
                    <select
                      value={form.applicableForIntrastate}
                      onChange={(e) => handleChange("applicableForIntrastate", e.target.value)}
                      className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </label>
                </div>
              )}
            </div>

            {/* e-Invoice Details */}
            <div className="btn btn-secondary">
              <div className="btn btn-secondary">
                <FileText size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">e-Invoice Details</h3>
              </div>

              <label className="flex items-center justify-between p-2 bg-slate-50 rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-slate-500">e-Invoicing applicable</span>
                <select
                  value={form.eInvoicingApplicable}
                  onChange={(e) => handleChange("eInvoicingApplicable", e.target.value)}
                  className="bg-transparent font-bold text-xs text-purple-700 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
            </div>

            {/* Actions Form Section */}
            <div className="btn btn-secondary">
              {viewMode === "alter" ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="btn btn-danger"
                >
                  <Trash2 size={14} />
                  Delete Registration
                </button>
              ) : (
                <div />
              )}
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (registrations.length > 0) {
                      setViewMode("list");
                    } else {
                      navigate("/masters");
                    }
                  }}
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

          </div>
        </form>
      )}

      {/* ── 4. CONFIRM DELETE DIALOG ── */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card">
            <div className="text-center space-y-2">
              <div className="btn btn-danger">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Delete GST Registration?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete this GST profile? All related configurations will be lost.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="cb-btn-secondary flex-1 justify-center"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
