import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import { X, Plus, Trash2, Save, AlertCircle, CheckCircle } from "lucide-react";

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
  Payment:      { text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  accent: "#d97706" },
  Receipt:      { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", accent: "#059669" },
  Journal:      { text: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  accent: "#7c3aed" },
  Sales:        { text: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200",  accent: "#4338ca" },
  Purchase:     { text: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200",    accent: "#be185d" },
  Contra:       { text: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     accent: "#0369a1" },
  "Debit Note": { text: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    accent: "#be123c" },
  "Credit Note":{ text: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",    accent: "#0f766e" },
};

const DR_TYPES = ["Payment", "Journal", "Contra", "Purchase", "Debit Note"];
const SALES_PURCHASE = ["Sales", "Purchase", "Debit Note", "Credit Note"];

const fmt = n =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

/* ── Reusable ledger search dropdown ── */
function LedgerDropdown({ search, onSearchChange, onSelect, ledgers, placeholder, inputClass }) {
  const [open, setOpen] = useState(false);
  const filtered = ledgers.filter(l =>
    l.name.toLowerCase().includes((search || "").toLowerCase())
  );
  return (
    <div className="relative">
      <input
        type="text"
        autoComplete="off"
        className={inputClass || "w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-purple-400 bg-white"}
        placeholder={placeholder || "Search ledger…"}
        value={search}
        onChange={e => { onSearchChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(l => (
            <button
              key={l.id}
              onMouseDown={() => { onSelect(l); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 border-b border-slate-50 last:border-0 flex items-center justify-between"
            >
              <span className="font-medium">{l.name}</span>
              <span className="text-[10px] text-slate-400">{l.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tally-style field row ── */
function TallyRow({ label, children, hint }) {
  return (
    <div className="flex items-center border-b border-slate-100 last:border-0 py-1.5 gap-3 min-h-[36px]">
      <span className="text-[12px] font-semibold text-slate-600 w-40 shrink-0">{label}</span>
      <span className="text-slate-400 text-xs mr-1">:</span>
      <div className="flex-1">{children}</div>
      {hint && <span className="text-[10px] text-slate-400 italic">{hint}</span>}
    </div>
  );
}

export default function VoucherForm({ type: initialType, companyId, ledgers = [], onClose, onSaved }) {
  const [voucherType,     setVoucherType]     = useState(initialType || "Payment");
  const [date,            setDate]            = useState(new Date().toISOString().split("T")[0]);
  const [narration,       setNarration]       = useState("");
  const [refNo,           setRefNo]           = useState("");

  // Main "Party A/c" / balancing ledger
  const [account,         setAccount]         = useState(null);
  const [accountSearch,   setAccountSearch]   = useState("");

  // For Sales/Purchase: Sales ledger / Purchase ledger
  const [salesLedger,     setSalesLedger]     = useState(null);
  const [salesLedgerSearch, setSalesLedgerSearch] = useState("");

  // Supplier Invoice (Purchase only)
  const [supplierInvNo,   setSupplierInvNo]   = useState("");
  const [supplierInvDate, setSupplierInvDate] = useState("");

  // Item lines for Sales/Purchase
  const [itemLines, setItemLines] = useState([
    { name: "", qty: "", rate: "", per: "Nos", amount: "" },
  ]);

  // Ledger lines for other voucher types
  const [entries, setEntries] = useState([
    { ledger_id: "", ledger_name: "", amount: "", search: "" },
  ]);

  const [error,  setError]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const style      = TYPE_STYLE[voucherType] || TYPE_STYLE.Payment;
  const isSalesPurchase = SALES_PURCHASE.includes(voucherType);
  const isDr       = DR_TYPES.includes(voucherType);

  /* ── Item line helpers ── */
  const updateItem = (idx, field, val) => {
    setItemLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      // Auto-calculate amount when qty or rate changes
      if (field === "qty" || field === "rate") {
        const q = field === "qty" ? parseFloat(val) : parseFloat(next[idx].qty);
        const r = field === "rate" ? parseFloat(val) : parseFloat(next[idx].rate);
        next[idx].amount = (!isNaN(q) && !isNaN(r)) ? (q * r).toFixed(2) : "";
      }
      return next;
    });
  };
  const addItemRow    = () => setItemLines(prev => [...prev, { name: "", qty: "", rate: "", per: "Nos", amount: "" }]);
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

      // Sales: Cr Sales ledger entries, Dr Party
      // Purchase: Dr Purchase ledger entries, Cr Party
      validItems.forEach(l => {
        apiEntries.push({
          ledger_id:   salesLedger?.id || account.id,
          ledger_name: l.name,
          dr_amount:   isDr ? parseFloat(l.amount) : 0,
          cr_amount:   isDr ? 0 : parseFloat(l.amount),
          gst_rate:    0,
        });
      });
      // Balancing entry on party side
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
      entries: apiEntries,
    };

    try {
      setSaving(true);
      await api.post("/vouchers/", payload);
      setSaved(true);
      onSaved?.();
      setTimeout(() => onClose(), 900);
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

  const inputCls = "w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-purple-400 bg-white";
  const smallInputCls = "px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-purple-400 bg-white w-full";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: 720, maxHeight: "94vh" }}
      >
        {/* ── Header bar ── */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-slate-100"
          style={{ borderLeft: `4px solid ${style.accent}`, background: "#f8fafc" }}
        >
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
              {voucherType}
            </span>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-tight">Accounting Voucher Creation</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {companyId ? `Company ID: ${companyId}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700">
              {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Voucher Type Switcher ── */}
        <div className="flex gap-1 px-5 pt-3 pb-1 flex-wrap">
          {VOUCHER_TYPES.map(({ key, type }) => {
            const active = voucherType === type;
            const ts = TYPE_STYLE[type] || TYPE_STYLE.Payment;
            return (
              <button
                key={type}
                onClick={() => setVoucherType(type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  active
                    ? `${ts.bg} ${ts.text} ${ts.border} shadow-sm`
                    : "text-slate-400 border-transparent hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {key && (
                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${active ? "bg-white/60" : "bg-slate-100"}`}>
                    {key}
                  </span>
                )}
                {type}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">

          {/* ── Purchase only: Supplier Invoice No + Date ── */}
          {voucherType === "Purchase" && (
            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Supplier Invoice No.
                </label>
                <input
                  type="text"
                  value={supplierInvNo}
                  onChange={e => setSupplierInvNo(e.target.value)}
                  placeholder="e.g. INV-001"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Supplier Invoice Date
                </label>
                <input
                  type="date"
                  value={supplierInvDate}
                  onChange={e => setSupplierInvDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── Tally-style header fields ── */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 space-y-0.5">

            {/* Date (for non-purchase; purchase shows date in header) */}
            <TallyRow label="Date">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-purple-400 bg-white w-44"
              />
            </TallyRow>

            {/* Ref / Cheque No (non-purchase) */}
            {voucherType !== "Purchase" && (
              <TallyRow label="Ref / Cheque No.">
                <input
                  type="text"
                  value={refNo}
                  onChange={e => setRefNo(e.target.value)}
                  placeholder="Optional"
                  className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-purple-400 bg-white w-56"
                />
              </TallyRow>
            )}

            {/* Party A/c Name */}
            <TallyRow label="Party A/c name" hint="(balancing ledger)">
              <LedgerDropdown
                search={accountSearch}
                onSearchChange={v => { setAccountSearch(v); setAccount(null); }}
                onSelect={l => { setAccount(l); setAccountSearch(l.name); }}
                ledgers={ledgers}
                placeholder="Search party / account…"
                inputClass={inputCls}
              />
            </TallyRow>
            {account && (
              <div className="flex items-center gap-2 px-1 pb-1">
                <span className="text-[11px] text-slate-400 w-40 shrink-0">Current balance</span>
                <span className="text-[11px] text-slate-400">:</span>
                <span className="text-[11px] font-semibold text-slate-600 ml-3 flex items-center gap-1">
                  <CheckCircle size={10} className="text-emerald-500" />
                  {account.name} · <span className="text-slate-400">{account.group}</span>
                </span>
              </div>
            )}

            {/* Sales ledger / Purchase ledger (for Sales/Purchase vouchers) */}
            {isSalesPurchase && (
              <>
                <TallyRow label={voucherType === "Sales" ? "Sales ledger" : "Purchase ledger"}>
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
                    inputClass={inputCls}
                  />
                </TallyRow>
                {salesLedger && (
                  <div className="flex items-center gap-2 px-1 pb-1">
                    <span className="text-[11px] text-slate-400 w-40 shrink-0">Current balance</span>
                    <span className="text-[11px] text-slate-400">:</span>
                    <span className="text-[11px] font-semibold text-slate-600 ml-3 flex items-center gap-1">
                      <CheckCircle size={10} className="text-emerald-500" />
                      {salesLedger.name} · <span className="text-slate-400">{salesLedger.group}</span>
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Item Table (Sales / Purchase / Debit Note / Credit Note) ── */}
          {isSalesPurchase && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Name of Item
              </div>

              {/* Table header */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid text-[10px] font-bold uppercase text-slate-400 tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-200"
                  style={{ gridTemplateColumns: "3fr 80px 90px 60px 100px 32px" }}>
                  <div>Name of Item</div>
                  <div className="text-center">Quantity</div>
                  <div className="text-center">Rate</div>
                  <div className="text-center">per</div>
                  <div className="text-right">Amount</div>
                  <div />
                </div>

                <div className="divide-y divide-slate-100">
                  {itemLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid items-center px-3 py-1.5 hover:bg-slate-50/60 group gap-2"
                      style={{ gridTemplateColumns: "3fr 80px 90px 60px 100px 32px" }}
                    >
                      {/* Item name (free text for now) */}
                      <input
                        type="text"
                        value={line.name}
                        onChange={e => updateItem(idx, "name", e.target.value)}
                        placeholder="Item name…"
                        className={smallInputCls}
                      />
                      {/* Qty */}
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={line.qty}
                        onChange={e => updateItem(idx, "qty", e.target.value)}
                        placeholder="0"
                        className={smallInputCls + " text-center"}
                      />
                      {/* Rate */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.rate}
                        onChange={e => updateItem(idx, "rate", e.target.value)}
                        placeholder="0.00"
                        className={smallInputCls + " text-right"}
                      />
                      {/* Per */}
                      <input
                        type="text"
                        value={line.per}
                        onChange={e => updateItem(idx, "per", e.target.value)}
                        className={smallInputCls + " text-center"}
                      />
                      {/* Amount */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.amount}
                        onChange={e => updateItem(idx, "amount", e.target.value)}
                        placeholder="0.00"
                        className={smallInputCls + " text-right font-mono"}
                      />
                      {/* Remove */}
                      <button
                        onClick={() => removeItemRow(idx)}
                        disabled={itemLines.length === 1}
                        className="p-1 rounded text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:hidden"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add row */}
                <button
                  onClick={addItemRow}
                  className="w-full flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 transition-colors border-t border-slate-100"
                >
                  <Plus size={12} /> Add Item
                </button>
              </div>

              {/* Item Total */}
              <div className="flex items-center justify-between mt-2 px-2">
                <span className="text-xs text-slate-400">Total Amount</span>
                <span className="font-mono font-bold text-slate-800 text-sm">₹{fmt(itemTotal)}</span>
              </div>
            </div>
          )}

          {/* ── Ledger Particulars (Payment / Receipt / Journal / Contra) ── */}
          {!isSalesPurchase && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Particulars
                  <span className="ml-2 font-normal normal-case text-slate-300">
                    ({isDr ? "Debit" : "Credit"} side)
                  </span>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-400 tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <div className="col-span-8">Ledger</div>
                  <div className="col-span-3 text-right">Amount (₹)</div>
                  <div className="col-span-1" />
                </div>

                <div className="divide-y divide-slate-100">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center px-3 py-1.5 hover:bg-slate-50/60 group gap-2">
                      <div className="col-span-8 pr-2">
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
                          inputClass={smallInputCls}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={smallInputCls + " text-right font-mono"}
                          placeholder="0.00"
                          value={entry.amount}
                          onChange={e => updateEntry(idx, "amount", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => removeRow(idx)}
                          disabled={entries.length === 1}
                          className="p-1 rounded text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:hidden"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addRow}
                  className="w-full flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50 transition-colors border-t border-slate-100"
                >
                  <Plus size={12} /> Add Line
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 px-2">
                <span className="text-xs text-slate-400">Total</span>
                <span className="font-mono font-bold text-slate-800">₹{fmt(entryTotal)}</span>
              </div>
            </div>
          )}

          {/* ── Narration ── */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Narration
            </label>
            <textarea
              rows={2}
              value={narration}
              onChange={e => setNarration(e.target.value)}
              placeholder="Enter narration / description…"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold">
              <CheckCircle size={14} /> Voucher saved successfully!
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              <kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">Esc</kbd> Close
            </span>
            <span>
              <kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">Ctrl+↵</kbd> Save
            </span>
            <span className="text-slate-300">Total: <span className="font-mono font-bold text-slate-600">₹{fmt(totalAmount)}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || saved}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                saving || saved ? "bg-slate-400" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              <Save size={14} className={saving ? "animate-spin" : ""} />
              {saving ? "Saving…" : saved ? "Saved!" : "Accept Voucher"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
