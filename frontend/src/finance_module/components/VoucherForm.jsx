import { useState, useEffect } from "react";
import api from "../api/client";
import { X, Plus, Trash2, Save, AlertCircle, CheckCircle, ChevronLeft } from "lucide-react";
import LedgerCreateModal from "./LedgerCreateModal";

const VOUCHER_TYPES = [
  { key: "F4", type: "Contra" },
  { key: "F5", type: "Payment" },
  { key: "F6", type: "Receipt" },
  { key: "F7", type: "Journal" },
  { key: "F8", type: "Sales" },
  { key: "F9", type: "Purchase" },
  { key: "",   type: "Debit Note" },
  { key: "",   type: "Credit Note" },
];

const TYPE_STYLE = {
  Payment:      { text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  accent: "#d97706",  lightBg: "#fffbeb" },
  Receipt:      { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", accent: "#059669",  lightBg: "#f0fdf4" },
  Journal:      { text: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  accent: "#7c3aed",  lightBg: "#faf5ff" },
  Sales:        { text: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  accent: "#4338ca",  lightBg: "#eef2ff" },
  Purchase:     { text: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200",    accent: "#be185d",  lightBg: "#fdf2f8" },
  Contra:       { text: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     accent: "#0369a1",  lightBg: "#f0f9ff" },
  "Debit Note": { text: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    accent: "#be123c",  lightBg: "#fff1f2" },
  "Credit Note":{ text: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",    accent: "#0f766e",  lightBg: "#f0fdfa" },
};

const DR_TYPES = ["Payment", "Journal", "Contra", "Purchase", "Debit Note"];
const SALES_PURCHASE = ["Sales", "Purchase", "Debit Note", "Credit Note"];

const fmt = n =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

/* ── Ledger search dropdown ── */
function LedgerDropdown({ search, onSearchChange, onSelect, ledgers, placeholder, onCreateNew }) {
  const [open, setOpen] = useState(false);
  const filtered = (ledgers || []).filter(l =>
    l.name.toLowerCase().includes((search || "").toLowerCase())
  );

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, position: "relative" }}>
        <input
          type="text"
          autoComplete="off"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: "var(--radius-sm, 6px)",
            fontSize: 14,
            background: "var(--bg-input, #ffffff)",
            color: "var(--text-primary, #0f172a)",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          placeholder={placeholder || "Search ledger…"}
          value={search}
          onChange={e => { onSearchChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onKeyDown={e => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {open && filtered.length > 0 && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--bg-card, #ffffff)",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: "var(--radius-sm, 6px)",
            boxShadow: "var(--shadow-md)",
            zIndex: 200,
            maxHeight: 220,
            overflowY: "auto",
          }}>
            {filtered.map(l => (
              <button
                key={l.id}
                type="button"
                onMouseDown={() => { onSelect(l); setOpen(false); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 14px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontWeight: 500 }}>{l.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{l.group}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {onCreateNew && (
        <button
          type="button"
          onClick={onCreateNew}
          title="Create New Ledger"
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-muted)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,70,229,0.1)"; e.currentTarget.style.color = "var(--primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

/* ── Field row ── */
function FieldRow({ label, hint, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ width: 160, flexShrink: 0, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", paddingTop: 8 }}>
        {label}
      </span>
      <span style={{ color: "var(--text-muted)", paddingTop: 8, marginRight: 4 }}>:</span>
      <div style={{ flex: 1 }}>{children}</div>
      {hint && <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", paddingTop: 8 }}>{hint}</span>}
    </div>
  );
}

export default function VoucherForm({ type: initialType, companyId, ledgers = [], stockItems = [], locations = [], onClose, onSaved }) {
  const [voucherType,           setVoucherType]           = useState(initialType || "Payment");
  const [date,                  setDate]                  = useState(new Date().toISOString().split("T")[0]);
  const [narration,             setNarration]             = useState("");
  const [refNo,                 setRefNo]                 = useState("");
  const [account,               setAccount]               = useState(null);
  const [accountSearch,         setAccountSearch]         = useState("");
  const [salesLedger,           setSalesLedger]           = useState(null);
  const [salesLedgerSearch,     setSalesLedgerSearch]     = useState("");
  const [supplierInvNo,         setSupplierInvNo]         = useState("");
  const [supplierInvDate,       setSupplierInvDate]       = useState("");
  const [itemLines,             setItemLines]             = useState([{ name: "", stock_item_id: "", location_id: "", qty: "", rate: "", per: "Nos", amount: "" }]);
  const [entries,               setEntries]               = useState([{ ledger_id: "", ledger_name: "", amount: "", search: "" }]);
  const [error,                 setError]                 = useState(null);
  const [saving,                setSaving]                = useState(false);
  const [saved,                 setSaved]                 = useState(false);
  const [ledgerCreateTarget,    setLedgerCreateTarget]    = useState(null);

  const style        = TYPE_STYLE[voucherType] || TYPE_STYLE.Payment;
  const isSalesPurchase = SALES_PURCHASE.includes(voucherType);
  const isDr         = DR_TYPES.includes(voucherType);

  /* ── When type changes from outside ── */
  useEffect(() => {
    setVoucherType(initialType || "Payment");
    setError(null);
    setSaved(false);
  }, [initialType]);

  /* ── Item line helpers ── */
  const updateItem = (idx, field, val) => {
    setItemLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      if (field === "qty" || field === "rate") {
        const q = field === "qty" ? parseFloat(val) : parseFloat(next[idx].qty);
        const r = field === "rate" ? parseFloat(val) : parseFloat(next[idx].rate);
        next[idx].amount = (!isNaN(q) && !isNaN(r)) ? (q * r).toFixed(2) : "";
      }
      return next;
    });
  };
  const addItemRow    = () => setItemLines(prev => [...prev, { name: "", stock_item_id: "", location_id: "", qty: "", rate: "", per: "Nos", amount: "" }]);
  const removeItemRow = idx => setItemLines(prev => prev.filter((_, i) => i !== idx));

  /* ── Ledger entry helpers ── */
  const updateEntry = (idx, field, val) => {
    setEntries(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; });
  };
  const addRow    = () => setEntries(prev => [...prev, { ledger_id: "", ledger_name: "", amount: "", search: "" }]);
  const removeRow = idx => setEntries(prev => prev.filter((_, i) => i !== idx));

  /* ── Totals ── */
  const itemTotal   = itemLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const entryTotal  = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalAmount = isSalesPurchase ? itemTotal : entryTotal;

  /* ── Submit ── */
  const handleSubmit = async () => {
    setError(null);
    if (!account) { setError("Please select Party A/c name."); return; }

    let apiEntries = [];
    if (isSalesPurchase) {
      const validItems = itemLines.filter(l => l.name.trim() && parseFloat(l.amount) > 0);
      if (validItems.length === 0) { setError("Add at least one item with amount."); return; }
      validItems.forEach(l => {
        apiEntries.push({
          ledger_id:   salesLedger?.id || account.id,
          ledger_name: l.name,
          dr_amount:   isDr ? parseFloat(l.amount) : 0,
          cr_amount:   isDr ? 0 : parseFloat(l.amount),
          gst_rate:    0,
          stock_item_id: l.stock_item_id ? Number(l.stock_item_id) : null,
          location_id: l.location_id ? Number(l.location_id) : null,
          qty:         l.qty ? parseFloat(l.qty) : null,
          rate:        l.rate ? parseFloat(l.rate) : null,
        });
      });
      apiEntries.push({
        ledger_id:   account.id,
        ledger_name: account.name,
        dr_amount:   isDr ? 0 : itemTotal,
        cr_amount:   isDr ? itemTotal : 0,
        gst_rate:    0,
      });
    } else {
      const valid = entries.filter(e => e.ledger_id && parseFloat(e.amount) > 0);
      if (valid.length === 0) { setError("Add at least one ledger entry with an amount."); return; }
      apiEntries = valid.map(e => ({
        ledger_id:   Number(e.ledger_id),
        ledger_name: e.ledger_name,
        dr_amount:   isDr ? parseFloat(e.amount) : 0,
        cr_amount:   isDr ? 0 : parseFloat(e.amount),
        gst_rate:    0,
      }));
      apiEntries.push({
        ledger_id:   account.id,
        ledger_name: account.name,
        dr_amount:   isDr ? 0 : entryTotal,
        cr_amount:   isDr ? entryTotal : 0,
        gst_rate:    0,
      });
    }

    const payload = {
      voucher_type: voucherType,
      date,
      narration,
      reference_no: voucherType === "Purchase" ? supplierInvNo : refNo,
      company_id: companyId,
      party_id: account.id,
      entries: apiEntries,
    };

    try {
      setSaving(true);
      await api.post("/vouchers/", payload);
      setSaved(true);
      onSaved?.();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(e => `${(e.loc || []).slice(1).join(" ")}: ${e.msg}`).join(" | "));
      } else {
        setError(typeof detail === "string" ? detail : "Error saving voucher.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); }
      VOUCHER_TYPES.forEach(({ key, type }) => {
        if (key && e.key === key) { e.preventDefault(); setVoucherType(type); }
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [account, entries, itemLines, voucherType, date, narration]);

  /* ── Input style ── */
  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const smallInputStyle = {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, animation: "fadeIn 0.3s ease-out" }}>
      {/* ── Card wrapper ── */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
      }}>

        {/* ── Header bar ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderLeft: `4px solid ${style.accent}`,
          background: style.lightBg || "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: "var(--radius-sm)", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <ChevronLeft size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Back</span>
            </button>
            <div style={{ width: 1, height: 20, background: "var(--border)" }} />
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: "100px",
              background: style.accent + "20",
              color: style.accent,
              border: `1px solid ${style.accent}40`,
            }}>
              {voucherType} Voucher
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Accounting Voucher Creation</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {companyId ? `Company ID: ${companyId}` : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
              {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "rgba(220,38,38,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Voucher Type Switcher ── */}
        <div style={{ display: "flex", gap: 6, padding: "10px 20px", flexWrap: "wrap", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          {VOUCHER_TYPES.map(({ key, type }) => {
            const active = voucherType === type;
            const ts = TYPE_STYLE[type] || TYPE_STYLE.Payment;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setVoucherType(type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: active ? `1px solid ${ts.accent}40` : "1px solid transparent",
                  background: active ? ts.accent + "15" : "transparent",
                  color: active ? ts.accent : "var(--text-muted)",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                }}
              >
                {key && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
                    background: active ? "rgba(255,255,255,0.5)" : "var(--bg-secondary)",
                    color: active ? ts.accent : "var(--text-muted)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    {key}
                  </span>
                )}
                {type}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Purchase: Supplier Invoice ── */}
          {voucherType === "Purchase" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 14, background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)", marginBottom: 6 }}>
                  Supplier Invoice No.
                </label>
                <input
                  type="text"
                  value={supplierInvNo}
                  onChange={e => setSupplierInvNo(e.target.value)}
                  placeholder="e.g. INV-001"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)", marginBottom: 6 }}>
                  Supplier Invoice Date
                </label>
                <input
                  type="date"
                  value={supplierInvDate}
                  onChange={e => setSupplierInvDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* ── Tally-style header fields ── */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <FieldRow label="Date">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ ...inputStyle, width: 180 }}
              />
            </FieldRow>

            {voucherType !== "Purchase" && (
              <FieldRow label="Ref / Cheque No.">
                <input
                  type="text"
                  value={refNo}
                  onChange={e => setRefNo(e.target.value)}
                  placeholder="Optional reference"
                  style={inputStyle}
                />
              </FieldRow>
            )}

            <FieldRow label="Party A/c Name" hint="(balancing ledger)">
              <LedgerDropdown
                search={accountSearch}
                onSearchChange={v => { setAccountSearch(v); setAccount(null); }}
                onSelect={l => { setAccount(l); setAccountSearch(l.name); }}
                ledgers={ledgers}
                placeholder="Search party / account…"
                onCreateNew={() => setLedgerCreateTarget("account")}
              />
              {account && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
                  <CheckCircle size={11} style={{ color: "var(--success)" }} />
                  <span><strong>{account.name}</strong> · {account.group}</span>
                </div>
              )}
            </FieldRow>

            {isSalesPurchase && (
              <FieldRow label={voucherType === "Sales" ? "Sales Ledger" : "Purchase Ledger"}>
                <LedgerDropdown
                  search={salesLedgerSearch}
                  onSearchChange={v => { setSalesLedgerSearch(v); setSalesLedger(null); }}
                  onSelect={l => { setSalesLedger(l); setSalesLedgerSearch(l.name); }}
                  ledgers={ledgers.filter(l =>
                    voucherType === "Sales"
                      ? l.group?.toLowerCase().includes("sales")
                      : l.group?.toLowerCase().includes("purchase")
                  )}
                  placeholder={`Select ${voucherType === "Sales" ? "sales" : "purchase"} ledger…`}
                  onCreateNew={() => setLedgerCreateTarget("sales")}
                />
                {salesLedger && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
                    <CheckCircle size={11} style={{ color: "var(--success)" }} />
                    <span><strong>{salesLedger.name}</strong> · {salesLedger.group}</span>
                  </div>
                )}
              </FieldRow>
            )}
          </div>

          {/* ── Item Table (Sales / Purchase / Notes) ── */}
          {isSalesPurchase && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)" }}>
                Items
              </div>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 2fr 80px 90px 60px 100px 36px", gap: 8, padding: "8px 12px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>
                <div>Ledger / Item Name</div>
                <div>Stock Item (Opt)</div>
                <div>Location (Opt)</div>
                <div style={{ textAlign: "center" }}>Qty</div>
                <div style={{ textAlign: "right" }}>Rate</div>
                <div style={{ textAlign: "center" }}>Per</div>
                <div style={{ textAlign: "right" }}>Amount</div>
                <div />
              </div>
              {itemLines.map((line, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 2fr 2fr 80px 90px 60px 100px 36px", gap: 8, padding: "8px 12px", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                  <input type="text" value={line.name} onChange={e => updateItem(idx, "name", e.target.value)} placeholder="Ledger item name…" style={smallInputStyle} />
                  
                  <select value={line.stock_item_id} onChange={e => updateItem(idx, "stock_item_id", e.target.value)} style={{ ...smallInputStyle, cursor: "pointer" }}>
                    <option value="">- Select Stock -</option>
                    {stockItems.map(si => (
                      <option key={si.id} value={si.id}>{si.name}</option>
                    ))}
                  </select>

                  <select value={line.location_id} onChange={e => updateItem(idx, "location_id", e.target.value)} style={{ ...smallInputStyle, cursor: "pointer" }}>
                    <option value="">- Location -</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>

                  <input type="number" min="0" step="0.001" value={line.qty} onChange={e => updateItem(idx, "qty", e.target.value)} placeholder="0" style={{ ...smallInputStyle, textAlign: "center" }} />
                  <input type="number" min="0" step="0.01" value={line.rate} onChange={e => updateItem(idx, "rate", e.target.value)} placeholder="0.00" style={{ ...smallInputStyle, textAlign: "right" }} />
                  <input type="text" value={line.per} onChange={e => updateItem(idx, "per", e.target.value)} style={{ ...smallInputStyle, textAlign: "center" }} />
                  <input type="number" min="0" step="0.01" value={line.amount} onChange={e => updateItem(idx, "amount", e.target.value)} placeholder="0.00" style={{ ...smallInputStyle, textAlign: "right", fontFamily: "monospace" }} />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={itemLines.length === 1}
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: itemLines.length === 1 ? "not-allowed" : "pointer", color: "var(--text-muted)", opacity: itemLines.length === 1 ? 0.4 : 1, transition: "all 0.15s" }}
                    onMouseEnter={e => { if (itemLines.length > 1) { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.color = "var(--danger)"; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={addItemRow}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: "var(--primary)", background: "rgba(79,70,229,0.06)", border: "1px dashed rgba(79,70,229,0.3)", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(79,70,229,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(79,70,229,0.06)"}
                >
                  <Plus size={13} /> Add Item Row
                </button>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>₹{fmt(itemTotal)}</span>
              </div>
            </div>
          )}

          {/* ── Ledger Particulars ── */}
          {!isSalesPurchase && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)" }}>
                  Particulars <span style={{ fontWeight: 400, textTransform: "none" }}>({isDr ? "Debit" : "Credit"} entries)</span>
                </span>
              </div>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 36px", gap: 8, padding: "8px 12px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>
                <div>Ledger</div>
                <div style={{ textAlign: "right" }}>Amount (₹)</div>
                <div />
              </div>
              {entries.map((entry, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 130px 36px", gap: 8, padding: "8px 12px", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                  <LedgerDropdown
                    search={entry.search}
                    onSearchChange={v => {
                      updateEntry(idx, "search", v);
                      updateEntry(idx, "ledger_name", v);
                      updateEntry(idx, "ledger_id", "");
                    }}
                    onSelect={l => {
                      setEntries(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], ledger_id: l.id, ledger_name: l.name, search: l.name };
                        return next;
                      });
                    }}
                    ledgers={ledgers}
                    placeholder="Select ledger…"
                    onCreateNew={() => setLedgerCreateTarget(idx)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    style={{ ...smallInputStyle, textAlign: "right", fontFamily: "monospace" }}
                    placeholder="0.00"
                    value={entry.amount}
                    onChange={e => updateEntry(idx, "amount", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={entries.length === 1}
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: entries.length === 1 ? "not-allowed" : "pointer", color: "var(--text-muted)", opacity: entries.length === 1 ? 0.4 : 1, transition: "all 0.15s" }}
                    onMouseEnter={e => { if (entries.length > 1) { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.color = "var(--danger)"; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={addRow}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: "var(--primary)", background: "rgba(79,70,229,0.06)", border: "1px dashed rgba(79,70,229,0.3)", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(79,70,229,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(79,70,229,0.06)"}
                >
                  <Plus size={13} /> Add Ledger Line
                </button>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>₹{fmt(entryTotal)}</span>
              </div>
            </div>
          )}

          {/* ── Narration ── */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)", marginBottom: 6 }}>
              Narration
            </label>
            <textarea
              rows={2}
              value={narration}
              onChange={e => setNarration(e.target.value)}
              placeholder="Enter narration / description…"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          {/* ── Error / Success ── */}
          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--danger)" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
          {saved && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.2)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--success)", fontWeight: 600 }}>
              <CheckCircle size={15} />
              Voucher saved successfully!
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
            <span>
              <kbd style={{ padding: "2px 6px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}>Esc</kbd>
              {" "}Close
            </span>
            <span>
              <kbd style={{ padding: "2px 6px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}>Ctrl+↵</kbd>
              {" "}Save
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              Total: <span style={{ fontFamily: "monospace", fontWeight: 700, color: style.accent }}>₹{fmt(totalAmount)}</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                fontSize: 14,
                fontWeight: 600,
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--bg-card)"}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || saved}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 22px",
                fontSize: 14,
                fontWeight: 700,
                background: saving || saved
                  ? "var(--text-muted)"
                  : `linear-gradient(135deg, ${style.accent}, ${style.accent}cc)`,
                color: "white",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: saving || saved ? "not-allowed" : "pointer",
                opacity: saving || saved ? 0.7 : 1,
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.15s",
              }}
            >
              <Save size={15} style={{ animation: saving ? "spin 1s linear infinite" : "none" }} />
              {saving ? "Saving…" : saved ? "Saved!" : "Accept Voucher"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline Ledger Creation Modal ── */}
      {ledgerCreateTarget !== null && (
        <LedgerCreateModal
          onClose={() => setLedgerCreateTarget(null)}
          onSuccess={(newLedger) => {
            if (ledgerCreateTarget === "account") {
              setAccount(newLedger);
              setAccountSearch(newLedger.name);
            } else if (ledgerCreateTarget === "sales") {
              setSalesLedger(newLedger);
              setSalesLedgerSearch(newLedger.name);
            } else if (typeof ledgerCreateTarget === "number") {
              const idx = ledgerCreateTarget;
              setEntries(prev => {
                const next = [...prev];
                next[idx] = { ...next[idx], ledger_id: newLedger.id, ledger_name: newLedger.name, search: newLedger.name };
                return next;
              });
            }
            setLedgerCreateTarget(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
