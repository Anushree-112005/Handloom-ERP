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
  Search,
  Tag
} from "lucide-react";

const CLASS_KEY = (companyId) => `cb_company_gst_classifications_${companyId}`;

const initialFormState = {
  name: "",
  hsnSacDetails: "Not Defined", // 'Not Defined' | 'Specify Details Here'
  hsnSac: "",
  description: "",
  gstRateDetails: "Not Defined", // 'Not Defined' | 'Specify Details Here'
  taxabilityType: "Taxable", // 'Taxable' | 'Nil Rated' | 'Exempt'
  gstRate: 0
};

export default function GstClassification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeCompany } = useCompanyStore();
  const companyId = activeCompany?.id;

  const [classifications, setClassifications] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'create' | 'alter'
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [form, setForm] = useState(initialFormState);

  // 1. Load classifications on mount
  useEffect(() => {
    if (companyId) {
      const saved = localStorage.getItem(CLASS_KEY(companyId));
      const list = saved ? JSON.parse(saved) : [];
      setClassifications(list);

      const urlMode = searchParams.get("mode");
      if (urlMode === "alter") {
        setViewMode("list");
      } else {
        if (list.length === 0) {
          setViewMode("create");
        } else {
          setViewMode("list");
        }
      }
    }
  }, [companyId, searchParams]);

  const handleCreateNew = () => {
    setForm(initialFormState);
    setViewMode("create");
  };

  const handleSelectClass = (cls) => {
    setSelectedClassId(cls.id);
    setForm(cls);
    setViewMode("alter");
  };

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setErrorMsg("Classification Name is required.");
      return false;
    }
    if (form.hsnSacDetails === "Specify Details Here" && !form.hsnSac.trim()) {
      setErrorMsg("HSN/SAC Code is required when specifying details.");
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
      const newClass = {
        ...form,
        id: "class_" + Date.now()
      };
      updatedList = [...classifications, newClass];
      setSuccessMsg("GST Classification created successfully!");
    } else if (viewMode === "alter") {
      updatedList = classifications.map(item => 
        item.id === selectedClassId ? { ...form, id: selectedClassId } : item
      );
      setSuccessMsg("GST Classification updated successfully!");
    }

    localStorage.setItem(CLASS_KEY(companyId), JSON.stringify(updatedList));
    setClassifications(updatedList);

    setTimeout(() => {
      setSuccessMsg("");
      setViewMode("list");
    }, 1500);
  };

  const handleDelete = () => {
    const updatedList = classifications.filter(item => item.id !== selectedClassId);
    localStorage.setItem(CLASS_KEY(companyId), JSON.stringify(updatedList));
    setClassifications(updatedList);
    setShowConfirmDelete(false);
    setSuccessMsg("GST Classification deleted successfully.");

    setTimeout(() => {
      setSuccessMsg("");
      setViewMode("list");
    }, 1500);
  };

  // Search filtering
  const filteredClassifications = classifications.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cls.hsnSac && cls.hsnSac.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Tag size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to access GST Classifications.</p>
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
            <Tag size={24} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">
              {viewMode === "create" && "GST Classification Creation"}
              {viewMode === "alter" && "GST Classification Alteration"}
              {viewMode === "list" && "GST Classifications List"}
            </h1>
            <p className="cb-page-subtitle">
              {viewMode === "create" && "Create custom HSN/SAC groups with assigned taxability rates"}
              {viewMode === "alter" && `Modify GST Classification: ${form.name}`}
              {viewMode === "list" && "Define and organize inventory/ledger GST rate groupings"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (viewMode === "create" || viewMode === "alter") {
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

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="font-bold">Success:</span> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="font-bold">Error:</span> {errorMsg}
        </div>
      )}

      {/* ── 1. LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search classification name or HSN..."
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
              Create Classification
            </button>
          </div>

          {filteredClassifications.length === 0 ? (
            <div className="cb-card p-12 text-center text-slate-400">
              <Tag className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm font-semibold">No GST classifications found</p>
              <p className="text-xs text-slate-400 mt-1">Create classification mappings to standardize your GST rate structures.</p>
            </div>
          ) : (
            <div className="cb-card divide-y divide-slate-100 bg-white">
              {filteredClassifications.map((cls) => (
                <div 
                  key={cls.id} 
                  className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                        {cls.name}
                      </span>
                      {cls.gstRateDetails === "Specify Details Here" && (
                        <span className="cb-badge bg-purple-50 text-purple-700 border border-purple-200">
                          {cls.taxabilityType} ({cls.gstRate}%)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {cls.hsnSacDetails === "Specify Details Here" ? (
                        <span>HSN/SAC: <span className="font-mono font-semibold text-slate-600">{cls.hsnSac}</span> - <span className="text-slate-500 italic">{cls.description || "No description"}</span></span>
                      ) : (
                        <span>HSN/SAC: <span className="italic text-slate-400">Not Defined</span></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleSelectClass(cls)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all border border-transparent hover:border-purple-100"
                      title="Edit Classification"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setShowConfirmDelete(true);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                      title="Delete Classification"
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

      {/* ── 2. FORM VIEW ── */}
      {(viewMode === "create" || viewMode === "alter") && (
        <form onSubmit={handleSave} className="bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 space-y-6 max-w-2xl mx-auto transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          
          {/* Classification Name */}
          <label className="flex flex-col gap-2 group">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide group-hover:text-purple-600 transition-colors">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="cb-input font-medium bg-white/50 border-slate-200 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 transition-all duration-300 rounded-xl px-4 py-3"
              placeholder="e.g. Cotton Fabrics 5%"
              required
              autoFocus
            />
          </label>

          {/* HSN/SAC & Related Details */}
          <div className="space-y-4 pt-6 border-t border-slate-100/50">
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
              </select>
            </label>

            {form.hsnSacDetails === "Specify Details Here" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">HSN/SAC Code</span>
                  <input
                    type="text"
                    value={form.hsnSac}
                    onChange={(e) => handleChange("hsnSac", e.target.value)}
                    className="cb-input font-mono font-semibold"
                    placeholder="e.g. 5208"
                  />
                </label>
                
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">Description</span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="cb-input"
                    placeholder="e.g. Cotton Fabrics"
                  />
                </label>
              </div>
            )}
          </div>

          {/* GST Rate & Related Details */}
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
              <div className="grid gap-4 sm:grid-cols-2">
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
                      className="cb-input font-mono font-semibold"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-8 border-t border-slate-100/50 flex justify-between items-center gap-3">
            {viewMode === "alter" ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm hover:shadow"
              >
                <Trash2 size={14} />
                Delete Classification
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Save size={15} />
                Accept / Save
              </button>
            </div>
          </div>

        </form>
      )}

      {/* Delete confirmation dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-11 h-11 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                <Trash2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Delete GST Classification?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete this GST Classification? It cannot be undone.
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-red-600/25 flex-1 justify-center transition-colors flex items-center gap-2"
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
