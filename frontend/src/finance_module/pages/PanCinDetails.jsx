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
        navigate("/masters");
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
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-all duration-300">
            <FileText size={24} className="text-white" />
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
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="font-bold">Success:</span> {successMsg}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 space-y-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="h-6 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Company Identifiers</h3>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2 group">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide group-hover:text-purple-600 transition-colors">PAN/Income Tax No.</span>
            <input
              type="text"
              value={form.pan}
              onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
              className="cb-input font-mono uppercase bg-white/50 border-slate-200 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 transition-all duration-300 rounded-xl px-4 py-3"
              placeholder="e.g. ABCDE1234F"
              maxLength={10}
            />
          </label>

          <label className="flex flex-col gap-2 group">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide group-hover:text-purple-600 transition-colors">Corporate Identity No. (CIN)</span>
            <input
              type="text"
              value={form.cin}
              onChange={(e) => handleChange("cin", e.target.value.toUpperCase())}
              className="cb-input font-mono uppercase bg-white/50 border-slate-200 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 transition-all duration-300 rounded-xl px-4 py-3"
              placeholder="e.g. U74999TN2026PTC123456"
              maxLength={21}
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <Save size={15} />
            {mutation.isPending ? "Saving..." : "Accept"}
          </button>
        </div>

        {mutation.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            Could not save statutory details. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}
