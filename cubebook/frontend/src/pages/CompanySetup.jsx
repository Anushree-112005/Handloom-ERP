import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies } from "../api";
import {
  Building2, Plus, Search, LogIn, Edit2, Trash2,
  RefreshCw, MapPin, Phone, Calendar, X, ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const AVATAR_COLORS = [
  "#7c3aed", "#2563eb", "#0d9488", "#db2777", "#d97706", "#4f46e5",
];

export default function CompanySetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeCompany, setCompany } = useCompanyStore();

  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: companyList = [], isLoading, refetch } = useQuery({
    queryKey: ["companies"],
    queryFn: () => companies.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setDeleteConfirm(null);
    },
  });

  const handleSelect = (company) => {
    localStorage.setItem("cb_company_id", company.id);
    localStorage.setItem("cb_company_name", company.name);
    setCompany(company);
    navigate("/dashboard");
  };

  const filtered = companyList.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.legal_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Bar ── */}
      <header style={{
        height: 64,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ width: 10, height: 10, background: "#ec4899", borderRadius: 3 }} />
              <div style={{ width: 10, height: 10, background: "#8b5cf6", borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ width: 10, height: 10, background: "#14b8a6", borderRadius: 3 }} />
              <div style={{ width: 10, height: 10, background: "#3b82f6", borderRadius: 3 }} />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", lineHeight: 1 }}>CubeBook</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Accounting Software</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", letterSpacing: "-0.01em" }}>
          Company Setup
        </div>

        {/* Back button */}
        {activeCompany && (
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 10,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              color: "#475569", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
        )}
        {!activeCompany && <div style={{ width: 120 }} />}
      </header>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 780 }}>

          {/* Page heading */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
            }}>
              <Building2 size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>
                Select Company
              </h1>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0", fontWeight: 500 }}>
                Choose a company to work with, or create a new one
              </p>
            </div>
          </div>

          {/* ── Toolbar row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px 9px 36px",
                  border: "1px solid #e2e8f0", borderRadius: 10,
                  background: "#fff", fontSize: 13, color: "#1e293b",
                  outline: "none", boxSizing: "border-box",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              title="Refresh"
              style={{
                padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 10,
                background: "#fff", color: "#64748b", cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <RefreshCw size={14} />
            </button>

            {/* Add Company */}
            <button
              onClick={() => navigate("/company/create")}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff", fontSize: 13, fontWeight: 700,
                border: "none", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <Plus size={15} />
              Add Company
            </button>
          </div>

          {/* ── Company Cards ── */}
          <div style={{
            background: "#fff", borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}>

            {/* Loading */}
            {isLoading && (
              <div style={{ padding: "64px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#94a3b8" }}>
                <div style={{
                  width: 32, height: 32, border: "3px solid #e2e8f0",
                  borderTopColor: "#7c3aed", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ fontSize: 13 }}>Loading companies...</span>
              </div>
            )}

            {/* Empty */}
            {!isLoading && filtered.length === 0 && (
              <div style={{ padding: "64px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#94a3b8" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Building2 size={24} color="#cbd5e1" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {search ? "No companies match your search" : "No companies yet"}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate("/company/create")}
                    style={{
                      fontSize: 13, fontWeight: 700, color: "#7c3aed",
                      background: "none", border: "none", cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    + Create your first company
                  </button>
                )}
              </div>
            )}

            {/* Company rows */}
            {!isLoading && filtered.map((company, idx) => {
              const isActive = company.id === activeCompany?.id;
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <div
                  key={company.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    padding: "14px 20px",
                    borderBottom: "1px solid #f1f5f9",
                    background: isActive ? "#faf5ff" : "#fff",
                    transition: "background 0.15s",
                    gap: 16,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fff"; }}
                >
                  {/* Left: avatar + info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: avatarColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 800, fontSize: 16,
                    }}>
                      {company.name[0].toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                          {company.name}
                        </span>
                        {isActive && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 6,
                            background: "#ede9fe", color: "#6d28d9",
                            fontSize: 10, fontWeight: 700,
                          }}>
                            <CheckCircle2 size={10} />
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 3, flexWrap: "wrap" }}>
                        {(company.address || company.city) && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}>
                            <MapPin size={11} />
                            {[company.address, company.city].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {company.phone && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}>
                            <Phone size={11} />
                            {company.phone}
                          </span>
                        )}
                        {company.current_fy?.label && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}>
                            <Calendar size={11} />
                            {company.current_fy.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {/* Open */}
                    <button
                      onClick={() => handleSelect(company)}
                      title={isActive ? "Already open" : "Open Company"}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 9,
                        background: isActive ? "#ede9fe" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: isActive ? "#6d28d9" : "#fff",
                        border: isActive ? "1px solid #ddd6fe" : "none",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        boxShadow: isActive ? "none" : "0 2px 8px rgba(124,58,237,0.25)",
                        transition: "all 0.15s",
                      }}
                    >
                      <LogIn size={13} />
                      {isActive ? "Open" : "Select"}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => { handleSelect(company); navigate("/company/alter"); }}
                      title="Edit Company"
                      style={{
                        padding: "7px 10px", borderRadius: 9,
                        border: "1px solid #e2e8f0", background: "#f8fafc",
                        color: "#64748b", cursor: "pointer",
                        display: "flex", alignItems: "center",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#f8fafc"; }}
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Delete (not for active) */}
                    {!isActive && (
                      <button
                        onClick={() => setDeleteConfirm(company)}
                        title="Delete Company"
                        style={{
                          padding: "7px 10px", borderRadius: 9,
                          border: "1px solid #e2e8f0", background: "#f8fafc",
                          color: "#94a3b8", cursor: "pointer",
                          display: "flex", alignItems: "center",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fff5f5"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Footer count */}
            {!isLoading && filtered.length > 0 && (
              <div style={{
                padding: "10px 20px",
                background: "#f8fafc",
                borderTop: "1px solid #f1f5f9",
                fontSize: 11, color: "#94a3b8", fontWeight: 500,
              }}>
                {filtered.length} of {companyList.length} {companyList.length === 1 ? "company" : "companies"}
              </div>
            )}
          </div>

          {/* Quick tip */}
          <p style={{ textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 20 }}>
            Press <kbd style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 6px", fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>F3</kbd> from anywhere to return to this screen
          </p>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 18, padding: 28,
              width: "100%", maxWidth: 360,
              boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
              border: "1px solid #f1f5f9",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "#fff1f2", display: "flex",
              alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Trash2 size={22} color="#ef4444" />
            </div>
            <h3 style={{ textAlign: "center", fontWeight: 800, fontSize: 16, color: "#0f172a", margin: "0 0 8px" }}>
              Delete Company?
            </h3>
            <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: "#0f172a" }}>"{deleteConfirm.name}"</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: "10px 0", border: "1px solid #e2e8f0",
                  borderRadius: 10, background: "#f8fafc", color: "#475569",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                style={{
                  flex: 1, padding: "10px 0", border: "none",
                  borderRadius: 10, background: "#ef4444", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: deleteMutation.isPending ? 0.6 : 1,
                }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
