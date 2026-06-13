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
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Tag size={20} className="text-white" />
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
        <div className="btn btn-success">
          <span className="font-bold">Success:</span> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="btn btn-danger">
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
                  className="btn btn-secondary"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                        {cls.name}
                      </span>
                      {cls.gstRateDetails === "Specify Details Here" && (
                        <span className="btn btn-primary">
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
                      className="btn btn-primary"
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
                      className="btn btn-danger"
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
        <form onSubmit={handleSave} className="cb-card max-w-2xl bg-white p-6 space-y-6 mx-auto">
          
          {/* Classification Name */}
          <label className="flex flex-col gap-1.5">
            <span className="cb-label font-bold text-slate-500">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="cb-input font-medium"
              placeholder="e.g. Cotton Fabrics 5%"
              required
              autoFocus
            />
          </label>

          {/* HSN/SAC & Related Details */}
          <div className="btn btn-secondary">
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
          <div className="btn btn-secondary">
            {viewMode === "alter" ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="btn btn-danger"
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
      )}

      {/* Delete confirmation dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card">
            <div className="text-center space-y-2">
              <div className="btn btn-danger">
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
