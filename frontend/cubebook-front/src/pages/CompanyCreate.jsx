import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies } from "../api";
import {
  Building2,
  Save,
  X,
  MapPin,
  Phone,
  Globe,
  Briefcase,
  Calendar,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const INDIAN_STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"], ["24", "Gujarat"], ["27", "Maharashtra"],
  ["29", "Karnataka"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["19", "West Bengal"],
];

/* ── Reusable Field Components ─────────────────────────────────────── */

function FieldRow({ label, required, children }) {
  return (
    <div className="btn btn-secondary">
      <label className="w-44 shrink-0 text-sm font-medium text-slate-500 pt-2 leading-snug">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-[#f8f9fc] border border-slate-200 rounded-lg text-sm text-slate-800 " +
  "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 " +
  "placeholder:text-slate-300 transition-all";

const selectCls =
  "w-full px-3 py-2 bg-[#f8f9fc] border border-slate-200 rounded-lg text-sm text-slate-800 " +
  "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition-all";

/* ── Section Header ─────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="btn btn-secondary">
      <Icon size={14} className="text-purple-500" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */

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
    mobile: "+91 - ",
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
        mobile: activeCompany.phone || "+91 - ",
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
      navigate("/cubebook/");
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.detail || "Error updating company");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans">

      {/* ── Top Bar (matches app TopBar style) ── */}
      <header className="btn btn-secondary">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 flex gap-1 items-center justify-center">
            <div className="flex flex-col gap-0.5">
              <div className="w-2.5 h-2.5 bg-pink-500 rounded-sm" />
              <div className="btn btn-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="w-2.5 h-2.5 bg-teal-500 rounded-sm" />
              <div className="btn btn-primary" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-none text-sm">CubeBook</h1>
            <p className="text-[10px] text-slate-500">Accounting Software</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
          <span>Home</span>
          <ChevronRight size={12} />
          <span>Company</span>
          <ChevronRight size={12} />
          <span className="text-purple-600 font-semibold">
            {isAlterMode ? "Alteration" : "Creation"}
          </span>
        </div>

        <button
          onClick={() => navigate("/cubebook/")}
          className="btn btn-secondary"
          title="Close"
        >
          <X size={16} />
        </button>
      </header>

      {/* ── Page Body ── */}
      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-4xl">

          {/* Page Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="btn btn-primary">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                {isAlterMode ? "Company Alteration" : "Company Creation"}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {isAlterMode
                  ? "Update your business profile details"
                  : "Set up your new company profile to get started"}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="btn btn-danger">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Card */}
          <form onSubmit={handleSave} className="card">

            {/* ── Section: Basic Information ── */}
            <SectionHeader icon={Briefcase} title="Basic Information" />
            <div className="px-6 py-2">
              <FieldRow label="Company Name" required>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Mailing Name">
                <input
                  type="text"
                  value={formData.legal_name}
                  onChange={(e) => set("legal_name", e.target.value)}
                  placeholder="Legal / mailing name"
                  className={inputCls}
                />
              </FieldRow>
            </div>

            {/* ── Section: Contact Information ── */}
            <SectionHeader icon={Phone} title="Contact Information" />
            <div className="px-6 py-2">
              <FieldRow label="Mobile">
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => set("mobile", e.target.value)}
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Telephone">
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => set("telephone", e.target.value)}
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="E-mail">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="admin@company.com"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Website">
                <div className="relative">
                  <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="www.company.com"
                    className={inputCls + " pl-9"}
                  />
                </div>
              </FieldRow>
            </div>

            {/* ── Section: Location Details ── */}
            <SectionHeader icon={MapPin} title="Location Details" />
            <div className="px-6 py-2">
              <FieldRow label="Address">
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street address..."
                  className={inputCls + " resize-none"}
                />
              </FieldRow>
              <FieldRow label="State">
                <select
                  value={formData.state_code}
                  onChange={(e) => set("state_code", e.target.value)}
                  className={selectCls}
                >
                  <option value="">Not Applicable</option>
                  {INDIAN_STATES.map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="Pincode">
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => set("pincode", e.target.value)}
                  placeholder="e.g. 400001"
                  className={inputCls}
                />
              </FieldRow>
            </div>

            {/* ── Section: Financial Year Setup ── */}
            <SectionHeader icon={Calendar} title="Financial Year Setup" />
            <div className="px-6 py-2">
              <FieldRow label="FY Beginning From">
                <input
                  type="date"
                  value={formData.fy_start}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fy_start: e.target.value,
                      books_start: e.target.value,
                    }))
                  }
                  className={selectCls}
                />
              </FieldRow>
              <FieldRow label="Books Beginning From">
                <input
                  type="date"
                  value={formData.books_start}
                  onChange={(e) => set("books_start", e.target.value)}
                  className={selectCls}
                />
              </FieldRow>
              <FieldRow label="Base Currency">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.currency_symbol}
                    onChange={(e) => set("currency_symbol", e.target.value)}
                    className={inputCls + " w-16 text-center font-bold"}
                  />
                  <input
                    type="text"
                    value={formData.formal_name}
                    onChange={(e) => set("formal_name", e.target.value)}
                    placeholder="INR"
                    className={inputCls}
                  />
                </div>
              </FieldRow>
            </div>

            {/* ── Footer Actions ── */}
            <div className="btn btn-secondary">
              <div className="text-xs text-slate-400">
                {isPending ? (
                  <span className="flex items-center gap-2 text-purple-600 font-medium animate-pulse">
                    <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    {isAlterMode ? "Saving changes..." : "Creating company..."}
                  </span>
                ) : (
                  <>Press <kbd className="card">Ctrl+S</kbd> to save</>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/cubebook/")}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                >
                  <Save size={15} />
                  {isAlterMode ? "Save Changes" : "Create Company"}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
