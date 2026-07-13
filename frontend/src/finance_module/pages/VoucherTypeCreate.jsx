import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TallyFormLayout, { FormRow, FormInput, FormSelect, SectionHeader } from "../components/layout/TallyFormLayout";

const BASE_VOUCHER_TYPES = [
  "Contra", "Payment", "Receipt", "Journal", "Sales", "Purchase", "Debit Note", "Credit Note"
];

const MOCK_VOUCHER_TYPES_KEY = "cb_mock_voucher_types";
const DEFAULT_VOUCHER_TYPES = [
  { name: "Payment", baseType: "Payment", numbering: "Automatic", prefix: "PMT/", printAfterSave: false, active: true },
  { name: "Receipt", baseType: "Receipt", numbering: "Automatic", prefix: "RCT/", printAfterSave: false, active: true },
  { name: "Journal", baseType: "Journal", numbering: "Automatic", prefix: "JNL/", printAfterSave: false, active: true },
  { name: "Sales", baseType: "Sales", numbering: "Automatic", prefix: "SLS/", printAfterSave: true, active: true },
  { name: "Purchase", baseType: "Purchase", numbering: "Automatic", prefix: "PUR/", printAfterSave: true, active: true },
  { name: "Contra", baseType: "Contra", numbering: "Automatic", prefix: "CON/", printAfterSave: false, active: true },
  { name: "Debit Note", baseType: "Debit Note", numbering: "Manual", prefix: "DN/", printAfterSave: false, active: true },
  { name: "Credit Note", baseType: "Credit Note", numbering: "Manual", prefix: "CN/", printAfterSave: false, active: true },
];

export default function VoucherTypeCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    alias: "",
    baseType: "Payment",
    abbreviation: "",
    active: true,
    numbering: "Automatic",
    prefix: "",
    retainOriginal: true,
    effectiveDates: false,
    zeroValued: false,
    optionalDefault: false,
    allowNarration: true,
    ledgerNarrations: false,
    whatsappAfterSave: false,
    printAfterSave: false,
  });

  const handleChange = (key, val) => {
    setForm({ ...form, [key]: val });
  };

  const handleSubmit = () => {
    if (!form.name) return;

    // Load existing mock voucher types or use default
    const saved = localStorage.getItem(MOCK_VOUCHER_TYPES_KEY);
    const existing = saved ? JSON.parse(saved) : DEFAULT_VOUCHER_TYPES;

    // Add new type
    const newType = {
      name: form.name,
      baseType: form.baseType,
      numbering: form.numbering,
      prefix: form.prefix || (form.name.substring(0, 3).toUpperCase() + "/"),
      printAfterSave: form.printAfterSave,
      active: form.active,
    };

    localStorage.setItem(MOCK_VOUCHER_TYPES_KEY, JSON.stringify([...existing, newType]));
    alert(`Voucher Type "${form.name}" created successfully!`);
    navigate("/masters/voucher-types"); // Navigate to list view
  };

  return (
    <TallyFormLayout
      title="Voucher Type"
      mode="create"
      onAccept={handleSubmit}
    >
      <SectionHeader title="General Settings" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="Voucher Type Name" required>
          <FormInput
            autoFocus
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Tax Invoice, Cash Payment"
          />
        </FormRow>

        <FormRow label="Alias" hint="Alternative abbreviation name">
          <FormInput
            value={form.alias}
            onChange={(e) => handleChange("alias", e.target.value)}
            placeholder="(optional alias)"
          />
        </FormRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="Select Type of Voucher" required>
          <FormSelect
            value={form.baseType}
            onChange={(e) => handleChange("baseType", e.target.value)}
          >
            {BASE_VOUCHER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </FormSelect>
        </FormRow>

        <FormRow label="Abbreviation">
          <FormInput
            value={form.abbreviation}
            onChange={(e) => handleChange("abbreviation", e.target.value)}
            placeholder="e.g. TxInv"
          />
        </FormRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="Method of Voucher Numbering">
          <FormSelect
            value={form.numbering}
            onChange={(e) => handleChange("numbering", e.target.value)}
          >
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
            <option value="None">None</option>
          </FormSelect>
        </FormRow>

        <FormRow label="Voucher Prefix">
          <FormInput
            value={form.prefix}
            onChange={(e) => handleChange("prefix", e.target.value)}
            style={{ fontFamily: 'monospace' }}
            placeholder="e.g. TI/"
          />
        </FormRow>
      </div>

      <SectionHeader title="Voucher Processing Rules" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <FormRow label="Activate this Voucher Type">
          <FormSelect
            value={form.active ? "Yes" : "No"}
            onChange={(e) => handleChange("active", e.target.value === "Yes")}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </FormSelect>
        </FormRow>

        <FormRow label="Allow narration in voucher">
          <FormSelect
            value={form.allowNarration ? "Yes" : "No"}
            onChange={(e) => handleChange("allowNarration", e.target.value === "Yes")}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </FormSelect>
        </FormRow>

        <FormRow label="Allow zero-valued transactions">
          <FormSelect
            value={form.zeroValued ? "Yes" : "No"}
            onChange={(e) => handleChange("zeroValued", e.target.value === "Yes")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </FormSelect>
        </FormRow>

        <FormRow label="Make 'Optional' by default">
          <FormSelect
            value={form.optionalDefault ? "Yes" : "No"}
            onChange={(e) => handleChange("optionalDefault", e.target.value === "Yes")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </FormSelect>
        </FormRow>

        <FormRow label="Use effective dates">
          <FormSelect
            value={form.effectiveDates ? "Yes" : "No"}
            onChange={(e) => handleChange("effectiveDates", e.target.value === "Yes")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </FormSelect>
        </FormRow>

        <FormRow label="Provide ledger narrations">
          <FormSelect
            value={form.ledgerNarrations ? "Yes" : "No"}
            onChange={(e) => handleChange("ledgerNarrations", e.target.value === "Yes")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </FormSelect>
        </FormRow>
      </div>

      <SectionHeader title="Printing & Output" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="Print voucher after save">
          <FormSelect
            value={form.printAfterSave ? "Yes" : "No"}
            onChange={(e) => handleChange("printAfterSave", e.target.value === "Yes")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </FormSelect>
        </FormRow>

        <FormRow label="WhatsApp after save">
          <FormSelect
            value={form.whatsappAfterSave ? "Yes" : "No"}
            onChange={(e) => handleChange("whatsappAfterSave", e.target.value === "Yes")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </FormSelect>
        </FormRow>
      </div>
    </TallyFormLayout>
  );
}
