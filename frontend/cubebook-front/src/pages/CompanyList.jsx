import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies } from "../api";
import {
  Building2, Plus, Search, Edit2, LogIn,
  Calendar, MapPin, Phone, Trash2, RefreshCw,
} from "lucide-react";

const AVATAR_COLORS = [
  "bg-purple-600", "bg-blue-600", "bg-teal-600",
  "bg-pink-600", "bg-amber-600", "bg-indigo-600",
];

export default function CompanyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeCompany, setCompany } = useCompanyStore();

  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState(false);

  const { data: companyList = [], isLoading, refetch } = useQuery({
    queryKey: ["companies"],
    queryFn: () => companies.list(),
  });

  const handleLoadDemo = async () => {
    try {
      setSeeding(true);
      setSeedingSuccess(false);
      await companies.seedTextile();
      setSeedingSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setTimeout(() => setSeedingSuccess(false), 3000);
    } catch (err) {
      alert("Error seeding textile company: " + (err.response?.data?.detail || err.message));
    } finally {
      setSeeding(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => companies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setDeleteConfirm(null);
    },
  });

  const handleOpen = (company) => {
    localStorage.setItem("cb_company_id", company.id);
    localStorage.setItem("cb_company_name", company.name);
    setCompany(company);
    navigate("/dashboard");
  };

  const filtered = companyList.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.legal_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = companyList.filter((c) => c.id === activeCompany?.id).length;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Company Master</h1>
            <p className="cb-page-subtitle">Manage all your registered business entities and financial setups</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="cb-btn-secondary p-2.5"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleLoadDemo}
            disabled={seeding}
            className="btn btn-primary"
          >
            {seeding ? "Seeding..." : seedingSuccess ? "Demo Loaded!" : "Load Textile Demo"}
          </button>
          <button
            onClick={() => navigate("/company/create")}
            className="cb-btn-primary"
          >
            <Plus size={14} />
            Add New Company
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="form-row">
        <StatCard
          label="Total Companies"
          value={companyList.length}
          color="border-l-purple-500"
          bg="bg-purple-50"
          textColor="text-purple-700"
        />
        <StatCard
          label="Active Company"
          value={activeCompany ? 1 : 0}
          color="border-l-teal-500"
          bg="bg-teal-50"
          textColor="text-teal-700"
        />
        <StatCard
          label="Current Company"
          value={activeCompany?.name || "None"}
          color="border-l-blue-500"
          bg="bg-blue-50"
          textColor="text-blue-700"
          isText
        />
      </div>

      {/* ── Search Bar ── */}
      <div className="card">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cb-input pl-9"
          />
        </div>
      </div>

      {/* ── Company Table ── */}
      <div className="card">

        {/* Table Header */}
        <div className="btn btn-secondary">
          <div className="col-span-4 cb-th">Company Name</div>
          <div className="col-span-3 cb-th">Location</div>
          <div className="col-span-2 cb-th">Financial Year</div>
          <div className="col-span-2 cb-th">Contact</div>
          <div className="col-span-1 cb-th text-right">Actions</div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-sm">Loading companies...</span>
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <div className="btn btn-secondary">
              <Building2 size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium">
              {search ? "No companies match your search" : "No companies found"}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/company/create")}
                className="text-purple-600 text-sm font-semibold hover:underline"
              >
                + Create your first company
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!isLoading && filtered.map((company, idx) => {
          const isActive = company.id === activeCompany?.id;
          return (
            <div
              key={company.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 last:border-0 items-center hover:bg-slate-50/70 transition-colors group ${
                isActive ? "bg-purple-50/40" : ""
              }`}
            >
              {/* Company Name */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0`}
                >
                  {company.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800 truncate">
                      {company.name}
                    </span>
                    {isActive && (
                      <span className="btn btn-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {company.legal_name || company.name}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                <MapPin size={12} className="shrink-0 text-slate-300" />
                <span className="truncate">
                  {[company.address, company.pincode].filter(Boolean).join(", ") || "—"}
                </span>
              </div>

              {/* FY */}
              <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={12} className="shrink-0 text-slate-300" />
                <span>{company.current_fy?.label || "—"}</span>
              </div>

              {/* Contact */}
              <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                <Phone size={12} className="shrink-0 text-slate-300" />
                <span className="truncate">{company.phone || company.email || "—"}</span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpen(company)}
                  title="Open Company"
                  className="btn btn-primary"
                >
                  <LogIn size={15} />
                </button>
                <button
                  onClick={() => {
                    handleOpen(company);
                    navigate("/company/alter");
                  }}
                  title="Alter Company"
                  className="btn btn-primary"
                >
                  <Edit2 size={15} />
                </button>
                {!isActive && (
                  <button
                    onClick={() => setDeleteConfirm(company)}
                    title="Delete Company"
                    className="btn btn-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div className="btn btn-secondary">
            Showing {filtered.length} of {companyList.length} companies
          </div>
        )}
      </div>

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="btn btn-danger">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-center font-bold text-slate-800 text-base">Delete Company?</h3>
            <p className="text-center text-sm text-slate-500 mt-1 mb-5">
              Are you sure you want to delete <span className="font-semibold text-slate-700">"{deleteConfirm.name}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="btn btn-danger"
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg, textColor, isText }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 border-l-4 ${color}`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-bold ${isText ? "text-sm truncate" : "text-2xl"} ${textColor}`}>
        {value}
      </p>
    </div>
  );
}
