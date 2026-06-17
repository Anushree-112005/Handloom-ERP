import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies } from "../api";
import { Building2, Save, ArrowLeft, MapPin, Phone, Globe, Calendar, DollarSign } from "lucide-react";

const INDIAN_STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"], ["24", "Gujarat"], ["27", "Maharashtra"],
  ["29", "Karnataka"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["19", "West Bengal"],
];

export default function CompanyCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { activeCompany, setCompany } = useCompanyStore();

  const isAlterMode = location.pathname.includes("/alter");

  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    address: "",
    state_code: "",
    country: "India",
    pincode: "",
    telephone: "",
    mobile: "",
    fax: "",
    email: "",
    website: "",
    fy_start: "2026-04-01",
    books_start: "2026-04-01",
    currency_symbol: "₹",
    formal_name: "INR",
  });

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isAlterMode && activeCompany) {
      setFormData({
        name: activeCompany.name || "",
        legal_name: activeCompany.legal_name || "",
        address: activeCompany.address || "",
        state_code: activeCompany.state_code || "",
        country: "India",
        pincode: activeCompany.pincode || "",
        telephone: "",
        mobile: activeCompany.phone || "",
        fax: "",
        email: activeCompany.email || "",
        website: "",
        fy_start: activeCompany.current_fy?.start_date || "2026-04-01",
        books_start: activeCompany.current_fy?.start_date || "2026-04-01",
        currency_symbol: "₹",
        formal_name: "INR",
      });
    }
  }, [isAlterMode, activeCompany]);

  const createMutation = useMutation({
    mutationFn: (data) => companies.create(data),
    onSuccess: (newCompany) => {
      localStorage.setItem("cb_company_id", newCompany.id);
      localStorage.setItem("cb_company_name", newCompany.name);
      setCompany(newCompany);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      navigate("/cubebook/masters/company-features?created=true");
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.detail || "Error creating company");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => companies.update(id, data),
    onSuccess: (updatedCompany) => {
      localStorage.setItem("cb_company_name", updatedCompany.name);
      setCompany(updatedCompany);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      navigate("/cubebook/dashboard");
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.detail || "Error updating company");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage("Company Name is required!");
      return;
    }
    setErrorMessage("");
    const payload = {
      name: formData.name,
      legal_name: formData.legal_name || formData.name,
      address: formData.address,
      state_code: formData.state_code || null,
      pincode: formData.pincode,
      phone: formData.mobile,
      email: formData.email,
      maintain_inventory: activeCompany?.maintain_inventory ?? false,
      fy_start: formData.fy_start,
    };
    if (isAlterMode && activeCompany) {
      updateMutation.mutate({ id: activeCompany.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  const handleNameChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, name: val };
      if (!prev.legal_name || prev.legal_name === prev.name) {
        updated.legal_name = val;
      }
      return updated;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">
              {isAlterMode ? "Company Alteration" : "Company Creation"}
            </h1>
            <p className="cb-page-subtitle">
              {isAlterMode ? "Modify details for the selected organization" : "Establish a new corporate entity for bookkeeping"}
            </p>
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

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-semibold">
          Error: {errorMessage}
        </div>
      )}

      {/* ── Form Container ── */}
      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-12 items-start pb-10">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Primary Mailing Details */}
          <div className="cb-card p-6 bg-white space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin size={16} className="text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Mailing Details</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="cb-label font-bold">Company Name <span className="text-red-500">*</span></span>
                <input 
                  autoFocus
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="cb-input font-bold text-slate-800"
                  placeholder="e.g. Acme Corporation"
                />
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="cb-label">Mailing Name</span>
                <input 
                  type="text" 
                  value={formData.legal_name} 
                  onChange={e => set("legal_name", e.target.value)} 
                  className="cb-input" 
                />
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="cb-label">Address</span>
                <textarea 
                  rows={3} 
                  value={formData.address} 
                  onChange={e => set("address", e.target.value)} 
                  className="cb-input resize-none" 
                  placeholder="Full registered address"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">State</span>
                <select 
                  value={formData.state_code} 
                  onChange={e => set("state_code", e.target.value)} 
                  className="cb-input"
                >
                  <option value="">Not Applicable</option>
                  {INDIAN_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Country</span>
                <input 
                  type="text" 
                  value={formData.country} 
                  readOnly 
                  className="cb-input bg-slate-50 text-slate-500" 
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Pincode</span>
                <input 
                  type="text" 
                  value={formData.pincode} 
                  onChange={e => set("pincode", e.target.value)} 
                  className="cb-input" 
                />
              </label>
            </div>
          </div>

          {/* Contact Details */}
          <div className="cb-card p-6 bg-white space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Phone size={16} className="text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Details</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Telephone</span>
                <input type="text" value={formData.telephone} onChange={e => set("telephone", e.target.value)} className="cb-input" />
              </label>
              
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Mobile No.</span>
                <input type="text" value={formData.mobile} onChange={e => set("mobile", e.target.value)} className="cb-input" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Fax No.</span>
                <input type="text" value={formData.fax} onChange={e => set("fax", e.target.value)} className="cb-input" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">E-mail</span>
                <input type="email" value={formData.email} onChange={e => set("email", e.target.value)} className="cb-input" />
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="cb-label">Website</span>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="url" value={formData.website} onChange={e => set("website", e.target.value)} className="cb-input pl-9" placeholder="https://" />
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6">

          {/* Financial Year Details */}
          <div className="cb-card p-6 bg-white space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar size={16} className="text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial Year Details</h3>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Financial year begins from</span>
                <input 
                  type="date" 
                  value={formData.fy_start} 
                  onChange={e => setFormData(prev => ({...prev, fy_start: e.target.value, books_start: e.target.value}))} 
                  className="cb-input" 
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Books beginning from</span>
                <input 
                  type="date" 
                  value={formData.books_start} 
                  onChange={e => set("books_start", e.target.value)} 
                  className="cb-input" 
                />
              </label>
            </div>
          </div>

          {/* Base Currency Information */}
          <div className="cb-card p-6 bg-white space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign size={16} className="text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Base Currency Information</h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex flex-col gap-1.5 w-1/3">
                  <span className="cb-label">Symbol</span>
                  <input 
                    type="text" 
                    value={formData.currency_symbol} 
                    onChange={e => set("currency_symbol", e.target.value)} 
                    className="cb-input text-center font-bold" 
                  />
                </label>

                <label className="flex flex-col gap-1.5 flex-1">
                  <span className="cb-label">Formal Name</span>
                  <input 
                    type="text" 
                    value={formData.formal_name} 
                    onChange={e => set("formal_name", e.target.value)} 
                    className="cb-input" 
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="cb-card p-6 bg-slate-50 border border-slate-200">
            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={isPending}
                className="cb-btn-primary w-full py-2.5 justify-center text-sm shadow-md"
              >
                <Save size={16} />
                {isPending ? "Saving..." : "Accept / Save"}
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="cb-btn-secondary w-full py-2.5 justify-center text-sm"
              >
                Cancel
              </button>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
