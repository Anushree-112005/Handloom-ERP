import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies } from "../api";
import { FileText, ArrowLeft, Save } from "lucide-react";

const STATUTORY_KEY = (companyId) => `cb_company_statutory_${companyId}`;

export default function PanCinDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeCompany, setCompany } = useCompanyStore();
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    pan: "",
    cin: ""
  });

  useEffect(() => {
    if (activeCompany) {
      const saved = localStorage.getItem(STATUTORY_KEY(activeCompany.id));
      const localCin = saved ? JSON.parse(saved).panCinDetails?.cin : "";
      
      setForm({
        pan: activeCompany.pan || "",
        cin: localCin || ""
      });
    }
  }, [activeCompany]);

  const mutation = useMutation({
    mutationFn: (payload) => companies.update(activeCompany.id, payload),
    onSuccess: (data) => {
      setCompany(data);
      queryClient.invalidateQueries({ queryKey: ["companies"] });

      // Save to local storage for CIN which may not be in db columns
      const saved = localStorage.getItem(STATUTORY_KEY(activeCompany.id));
      const config = saved ? JSON.parse(saved) : { gstDetails: {}, panCinDetails: {} };
      config.panCinDetails = { pan: form.pan, cin: form.cin };
      localStorage.setItem(STATUTORY_KEY(activeCompany.id), JSON.stringify(config));

      setSuccessMsg("PAN/CIN details updated successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        navigate("/cubebook/masters");
      }, 2000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeCompany) return;

    mutation.mutate({
      pan: form.pan
      // Send pan to backend, cin is saved in local storage config
    });
  };

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <FileText size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to configure PAN/CIN details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">PAN/CIN Details</h1>
            <p className="cb-page-subtitle">Configure company Income Tax PAN card and Corporate Registration Number (CIN)</p>
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

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="cb-card p-6 space-y-5 bg-white">
        <h3 className="btn btn-secondary">Company Identifiers</h3>
        
        <label className="flex flex-col gap-1.5">
          <span className="cb-label">PAN/Income Tax No.</span>
          <input
            type="text"
            value={form.pan}
            onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
            className="cb-input font-mono uppercase"
            placeholder="e.g. ABCDE1234F"
            maxLength={10}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="cb-label">Corporate Identity No. (CIN)</span>
          <input
            type="text"
            value={form.cin}
            onChange={(e) => handleChange("cin", e.target.value.toUpperCase())}
            className="cb-input font-mono uppercase"
            placeholder="e.g. U74999TN2026PTC123456"
            maxLength={21}
          />
        </label>

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
            disabled={mutation.isPending}
            className="cb-btn-primary"
          >
            <Save size={15} />
            {mutation.isPending ? "Saving..." : "Accept"}
          </button>
        </div>

        {mutation.isError && (
          <div className="btn btn-danger">
            Could not save statutory details. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}
