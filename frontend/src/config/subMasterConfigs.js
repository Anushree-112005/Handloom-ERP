/**
 * Sub Master Configuration Registry
 *
 * Each config object defines a master entity for the GenericMasterForm component.
 * The 'entity' key maps directly to the SubMaster DB table's entity column.
 * Fields map to: name, code, description, extra_field_1, extra_field_2, extra_field_3
 */
import {
  Palette, Hash, Ruler, Layers, Factory, MapPin, Truck,
  FileText, Shield, Box, Tag, Settings, Scissors, CheckSquare,
  DollarSign, Thermometer, Beaker, ClipboardList, Package,
  Wrench, BookOpen, Target, Percent, Globe, CreditCard,
  Users, ShoppingCart
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
//  PHASE 1 — Core System Basics (18 Masters)
// ═══════════════════════════════════════════════════════════

export const CURRENCY_MASTER = {
  entity: 'currency_master',
  title: 'Currency Master',
  icon: DollarSign,
  color: '#f59e0b',
  description: 'Manage currency codes used across orders and invoices.',
  fields: [
    { name: 'name', label: 'Currency Name', type: 'text', required: true, placeholder: 'e.g. Indian Rupee' },
    { name: 'code', label: 'Currency Code', type: 'text', required: true, placeholder: 'e.g. INR' },
    { name: 'extra_field_1', label: 'Symbol', type: 'text', placeholder: 'e.g. ₹' },
  ],
};

export const UNIT_MASTER = {
  entity: 'unit_master',
  title: 'Unit Master',
  icon: Ruler,
  color: '#6366f1',
  description: 'Units of measurement for yarn, fabric, and materials.',
  fields: [
    { name: 'name', label: 'Unit Name', type: 'text', required: true, placeholder: 'e.g. Meters' },
    { name: 'code', label: 'Short Code', type: 'text', required: true, placeholder: 'e.g. MTR' },
  ],
};

export const YARN_TYPE_MASTER = {
  entity: 'yarn_type_master',
  title: 'Yarn Type Master',
  icon: Layers,
  color: '#8b5cf6',
  description: 'Types of yarn used in textile production.',
  fields: [
    { name: 'name', label: 'Yarn Type', type: 'text', required: true, placeholder: 'e.g. Cotton' },
    { name: 'code', label: 'Short Code', type: 'text', placeholder: 'e.g. COT' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
};

export const YARN_COUNT_MASTER = {
  entity: 'yarn_count_master',
  title: 'Yarn Count Master',
  icon: Hash,
  color: '#ec4899',
  description: 'Yarn count values (Ne) for purchase and production.',
  fields: [
    { name: 'name', label: 'Count Value', type: 'text', required: true, placeholder: 'e.g. 40s' },
    { name: 'code', label: 'Count Code', type: 'text', placeholder: 'e.g. 40S' },
    { name: 'extra_field_1', label: 'Ply', type: 'text', placeholder: 'e.g. 2 Ply' },
  ],
};

export const COLOR_MASTER = {
  entity: 'color_master',
  title: 'Color Master',
  icon: Palette,
  color: '#f43f5e',
  description: 'Master list of colors used in fabric and yarn dyeing.',
  fields: [
    { name: 'name', label: 'Color Name', type: 'text', required: true, placeholder: 'e.g. Navy Blue' },
    { name: 'code', label: 'Color Code', type: 'text', placeholder: 'e.g. NVY-BLU' },
    { name: 'extra_field_1', label: 'Hex Code', type: 'color' },
  ],
};

export const DESIGN_TYPE_MASTER = {
  entity: 'design_type_master',
  title: 'Design Type Master',
  icon: Target,
  color: '#06b6d4',
  description: 'Types of fabric designs: Plain, Twill, Satin, Dobby etc.',
  fields: [
    { name: 'name', label: 'Design Type', type: 'text', required: true, placeholder: 'e.g. Twill' },
    { name: 'code', label: 'Short Code', type: 'text', placeholder: 'e.g. TWL' },
  ],
};

export const PROCESS_TYPE_MASTER = {
  entity: 'process_type_master',
  title: 'Process Type Master',
  icon: Settings,
  color: '#14b8a6',
  description: 'Manufacturing process types: Dyeing, Bleaching, Printing, etc.',
  fields: [
    { name: 'name', label: 'Process Name', type: 'text', required: true, placeholder: 'e.g. Reactive Dyeing' },
    { name: 'code', label: 'Process Code', type: 'text', placeholder: 'e.g. RD' },
    { name: 'description', label: 'Notes', type: 'textarea' },
  ],
};

export const HSN_CODE_MASTER = {
  entity: 'hsn_code_master',
  title: 'HSN Code Master',
  icon: FileText,
  color: '#0ea5e9',
  description: 'Harmonized System Nomenclature codes for GST classification.',
  fields: [
    { name: 'name', label: 'HSN Description', type: 'text', required: true, placeholder: 'e.g. Cotton fabrics, plain weave' },
    { name: 'code', label: 'HSN Code', type: 'text', required: true, placeholder: 'e.g. 52081100' },
    { name: 'extra_field_1', label: 'GST Rate (%)', type: 'text', placeholder: 'e.g. 5' },
  ],
};

export const LOOM_MASTER = {
  entity: 'loom_master',
  title: 'Loom Master',
  icon: Factory,
  color: '#84cc16',
  description: 'Individual loom machines with their numbers and locations.',
  fields: [
    { name: 'name', label: 'Loom Number', type: 'text', required: true, placeholder: 'e.g. L-001' },
    { name: 'code', label: 'Loom ID', type: 'text', placeholder: 'e.g. LOOM001' },
    { name: 'extra_field_1', label: 'Location / Shed', type: 'text', placeholder: 'e.g. Shed A' },
    { name: 'extra_field_2', label: 'Loom Width (inches)', type: 'text', placeholder: 'e.g. 190' },
  ],
};

export const LOOM_TYPE_MASTER = {
  entity: 'loom_type_master',
  title: 'Loom Type Master',
  icon: Factory,
  color: '#22c55e',
  description: 'Types of looms: Rapier, Air Jet, Projectile, etc.',
  fields: [
    { name: 'name', label: 'Loom Type', type: 'text', required: true, placeholder: 'e.g. Rapier' },
    { name: 'code', label: 'Short Code', type: 'text', placeholder: 'e.g. RPR' },
  ],
};

export const PARTY_TYPE_GROUP = {
  entity: 'party_type_group',
  title: 'Party Type / Group',
  icon: Tag,
  color: '#a855f7',
  description: 'Party type classifications and grouping categories.',
  fields: [
    { name: 'name', label: 'Group Name', type: 'text', required: true, placeholder: 'e.g. Textile Suppliers' },
    { name: 'code', label: 'Group Code', type: 'text', placeholder: 'e.g. TXS' },
  ],
};

export const PAYMENT_TERMS_MASTER = {
  entity: 'payment_terms_master',
  title: 'Payment Terms Master',
  icon: CreditCard,
  color: '#f97316',
  description: 'Payment terms for invoices and purchase orders.',
  fields: [
    { name: 'name', label: 'Payment Term', type: 'text', required: true, placeholder: 'e.g. Net 30 Days' },
    { name: 'code', label: 'Short Code', type: 'text', placeholder: 'e.g. NET30' },
    { name: 'extra_field_1', label: 'Days', type: 'text', placeholder: 'e.g. 30' },
  ],
};

export const GODOWN_MASTER = {
  entity: 'godown_master',
  title: 'Godown Master',
  icon: Box,
  color: '#78716c',
  description: 'Warehouse and godown locations for stock storage.',
  fields: [
    { name: 'name', label: 'Godown Name', type: 'text', required: true, placeholder: 'e.g. Main Warehouse' },
    { name: 'code', label: 'Godown Code', type: 'text', placeholder: 'e.g. GD-01' },
    { name: 'extra_field_1', label: 'Location', type: 'text', placeholder: 'e.g. Factory Premises' },
  ],
};

export const GATE_LOCATION_MASTER = {
  entity: 'gate_location_master',
  title: 'Gate Location Master',
  icon: MapPin,
  color: '#dc2626',
  description: 'Entry and exit gate points in the factory.',
  fields: [
    { name: 'name', label: 'Gate Name', type: 'text', required: true, placeholder: 'e.g. Main Gate' },
    { name: 'code', label: 'Gate Code', type: 'text', placeholder: 'e.g. MG' },
  ],
};

export const MILL_NAME_MASTER = {
  entity: 'mill_name_master',
  title: 'Mill Name Master',
  icon: Factory,
  color: '#b45309',
  description: 'Spinning and yarn mill names for procurement tracking.',
  fields: [
    { name: 'name', label: 'Mill Name', type: 'text', required: true, placeholder: 'e.g. Vardhman Textiles' },
    { name: 'code', label: 'Mill Code', type: 'text', placeholder: 'e.g. VRD' },
    { name: 'extra_field_1', label: 'City', type: 'text', placeholder: 'e.g. Ludhiana' },
  ],
};

export const DISTRICT_CITY_MASTER = {
  entity: 'district_city_master',
  title: 'District & City Master',
  icon: Globe,
  color: '#0891b2',
  description: 'District and city codes for address management.',
  fields: [
    { name: 'name', label: 'City / District', type: 'text', required: true, placeholder: 'e.g. Erode' },
    { name: 'code', label: 'District Code', type: 'text', placeholder: 'e.g. ERD' },
    { name: 'extra_field_1', label: 'State', type: 'text', placeholder: 'e.g. Tamil Nadu' },
  ],
};

export const ORDER_TYPE_MASTER = {
  entity: 'order_type_master',
  title: 'Order Type Master',
  icon: ClipboardList,
  color: '#2563eb',
  description: 'Order categories: Export, Domestic, Job Work, Sample.',
  fields: [
    { name: 'name', label: 'Order Type', type: 'text', required: true, placeholder: 'e.g. Export Order' },
    { name: 'code', label: 'Type Code', type: 'text', placeholder: 'e.g. EXP' },
  ],
};

export const SALES_REGION_MASTER = {
  entity: 'sales_region_master',
  title: 'Sales Region Master',
  icon: MapPin,
  color: '#7c3aed',
  description: 'Sales zone/region definitions for territory management.',
  fields: [
    { name: 'name', label: 'Region Name', type: 'text', required: true, placeholder: 'e.g. South Zone' },
    { name: 'code', label: 'Region Code', type: 'text', placeholder: 'e.g. SZ' },
  ],
};


// ═══════════════════════════════════════════════════════════
//  PHASE 2 — Operations & Processing (20 Masters)
// ═══════════════════════════════════════════════════════════

export const CHECKER_NAME_MASTER = {
  entity: 'checker_name_master',
  title: 'Checker Name Master',
  icon: CheckSquare,
  color: '#059669',
  description: 'Quality checker personnel names for on-table inspection.',
  fields: [
    { name: 'name', label: 'Checker Name', type: 'text', required: true, placeholder: 'e.g. Rajan K' },
    { name: 'code', label: 'Employee Code', type: 'text', placeholder: 'e.g. CHK-001' },
  ],
};

export const GREY_CHECKER_NAME = {
  entity: 'grey_checker_name',
  title: 'Grey Checker Name',
  icon: CheckSquare,
  color: '#6b7280',
  description: 'Grey fabric checkers for greige cloth inspection.',
  fields: [
    { name: 'name', label: 'Checker Name', type: 'text', required: true },
    { name: 'code', label: 'Employee Code', type: 'text' },
  ],
};

export const CHECKING_TABLE_MACHINE = {
  entity: 'checking_table_machine',
  title: 'Checking Table & Machine',
  icon: Settings,
  color: '#475569',
  description: 'Inspection tables and machines used in quality checks.',
  fields: [
    { name: 'name', label: 'Machine / Table Name', type: 'text', required: true, placeholder: 'e.g. Table-01' },
    { name: 'code', label: 'Machine Code', type: 'text', placeholder: 'e.g. TBL01' },
    { name: 'extra_field_1', label: 'Location', type: 'text', placeholder: 'e.g. QC Department' },
  ],
};

export const CATEGORY_MASTER = {
  entity: 'category_master',
  title: 'Category Master',
  icon: Tag,
  color: '#d946ef',
  description: 'Product and material categories for classification.',
  fields: [
    { name: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g. Shirting' },
    { name: 'code', label: 'Category Code', type: 'text', placeholder: 'e.g. SHR' },
  ],
};

export const FABRIC_MASTER = {
  entity: 'fabric_master',
  title: 'Fabric Master',
  icon: Scissors,
  color: '#e11d48',
  description: 'Fabric construction types and specifications.',
  fields: [
    { name: 'name', label: 'Fabric Name', type: 'text', required: true, placeholder: 'e.g. Poplin 40x40' },
    { name: 'code', label: 'Fabric Code', type: 'text', placeholder: 'e.g. POP4040' },
    { name: 'extra_field_1', label: 'Construction', type: 'text', placeholder: 'e.g. 40x40/133x72' },
    { name: 'extra_field_2', label: 'Width (inches)', type: 'text', placeholder: 'e.g. 58' },
  ],
};

export const CHEMICAL_GROUP_MASTER = {
  entity: 'chemical_group_master',
  title: 'Chemical Group Master',
  icon: Beaker,
  color: '#16a34a',
  description: 'Chemical groups used in processing and finishing.',
  fields: [
    { name: 'name', label: 'Group Name', type: 'text', required: true, placeholder: 'e.g. Reactive Dyes' },
    { name: 'code', label: 'Group Code', type: 'text', placeholder: 'e.g. RDY' },
  ],
};

export const SIZING_CHEMICAL_MASTER = {
  entity: 'sizing_chemical_master',
  title: 'Sizing Chemical Master',
  icon: Beaker,
  color: '#ca8a04',
  description: 'Chemicals used in the sizing process for warp beams.',
  fields: [
    { name: 'name', label: 'Chemical Name', type: 'text', required: true, placeholder: 'e.g. PVA' },
    { name: 'code', label: 'Chemical Code', type: 'text', placeholder: 'e.g. PVA01' },
    { name: 'extra_field_1', label: 'Unit', type: 'text', placeholder: 'e.g. KG' },
  ],
};

export const DAMAGE_MASTER = {
  entity: 'damage_master',
  title: 'Damage / Grey Damage Master',
  icon: Shield,
  color: '#ef4444',
  description: 'Defect types found during fabric inspection.',
  fields: [
    { name: 'name', label: 'Damage Type', type: 'text', required: true, placeholder: 'e.g. Broken Pick' },
    { name: 'code', label: 'Defect Code', type: 'text', placeholder: 'e.g. BP' },
    { name: 'extra_field_1', label: 'Severity', type: 'select', options: ['Minor', 'Major', 'Critical'] },
  ],
};

export const DESIGN_COLOR_MASTER = {
  entity: 'design_color_master',
  title: 'Design Color Master',
  icon: Palette,
  color: '#a21caf',
  description: 'Color combinations specific to design patterns.',
  fields: [
    { name: 'name', label: 'Design Color Name', type: 'text', required: true, placeholder: 'e.g. Blue Stripe' },
    { name: 'code', label: 'Color Code', type: 'text', placeholder: 'e.g. BLS' },
    { name: 'extra_field_1', label: 'Hex Value', type: 'color' },
  ],
};

export const FINISHING_TYPE_MASTER = {
  entity: 'finishing_type_master',
  title: 'Finishing Type Master',
  icon: Wrench,
  color: '#0d9488',
  description: 'Fabric finishing processes: Calendering, Sanforizing, etc.',
  fields: [
    { name: 'name', label: 'Finishing Type', type: 'text', required: true, placeholder: 'e.g. Sanforizing' },
    { name: 'code', label: 'Process Code', type: 'text', placeholder: 'e.g. SAN' },
  ],
};

export const PRINTING_TECHNIQUE_MASTER = {
  entity: 'printing_technique_master',
  title: 'Printing Technique Master',
  icon: Palette,
  color: '#e879f9',
  description: 'Fabric printing methods: Screen, Digital, Rotary, etc.',
  fields: [
    { name: 'name', label: 'Technique', type: 'text', required: true, placeholder: 'e.g. Digital Printing' },
    { name: 'code', label: 'Technique Code', type: 'text', placeholder: 'e.g. DGP' },
  ],
};

export const PROCESS_SEQUENCES_MASTER = {
  entity: 'process_sequences_master',
  title: 'Process Sequences Master',
  icon: ClipboardList,
  color: '#0284c7',
  description: 'Define ordered process flows for different fabric types.',
  fields: [
    { name: 'name', label: 'Sequence Name', type: 'text', required: true, placeholder: 'e.g. Dye → Finish → Pack' },
    { name: 'code', label: 'Seq Code', type: 'text', placeholder: 'e.g. DFP' },
    { name: 'description', label: 'Steps Detail', type: 'textarea' },
  ],
};

export const DEBIT_CREDIT_REASON_MASTER = {
  entity: 'debit_credit_reason_master',
  title: 'Debit/Credit Reason Master',
  icon: FileText,
  color: '#d97706',
  description: 'Reasons for debit notes and credit notes in accounts.',
  fields: [
    { name: 'name', label: 'Reason', type: 'text', required: true, placeholder: 'e.g. Quality Rejection' },
    { name: 'code', label: 'Reason Code', type: 'text', placeholder: 'e.g. QR' },
    { name: 'extra_field_1', label: 'Type', type: 'select', options: ['Debit', 'Credit', 'Both'] },
  ],
};

export const EXPENSES_GROUP_HEAD = {
  entity: 'expenses_group_head',
  title: 'Expenses Group / Head',
  icon: DollarSign,
  color: '#b91c1c',
  description: 'Expense categories for accounting and costing.',
  fields: [
    { name: 'name', label: 'Expense Head', type: 'text', required: true, placeholder: 'e.g. Transport Charges' },
    { name: 'code', label: 'Head Code', type: 'text', placeholder: 'e.g. TRNS' },
    { name: 'extra_field_1', label: 'Group', type: 'text', placeholder: 'e.g. Direct Expenses' },
  ],
};

export const FIBRE_COUNT_MASTER = {
  entity: 'fibre_count_master',
  title: 'Fibre Count Master',
  icon: Hash,
  color: '#7e22ce',
  description: 'Fibre count specifications for raw material tracking.',
  fields: [
    { name: 'name', label: 'Fibre Count', type: 'text', required: true, placeholder: 'e.g. 60s Combed' },
    { name: 'code', label: 'Count Code', type: 'text', placeholder: 'e.g. 60SC' },
  ],
};

export const TDS_BILL_TYPE_MASTER = {
  entity: 'tds_bill_type_master',
  title: 'TDS Bill Type Master',
  icon: Percent,
  color: '#4338ca',
  description: 'TDS bill type classifications for tax deduction.',
  fields: [
    { name: 'name', label: 'Bill Type', type: 'text', required: true, placeholder: 'e.g. 194C - Contractor' },
    { name: 'code', label: 'Section Code', type: 'text', placeholder: 'e.g. 194C' },
    { name: 'extra_field_1', label: 'TDS Rate (%)', type: 'text', placeholder: 'e.g. 1' },
  ],
};

export const TEST_PARAMETER_MASTER = {
  entity: 'test_parameter_master',
  title: 'Test Parameter Master',
  icon: Thermometer,
  color: '#0369a1',
  description: 'Fabric testing parameters: GSM, Shrinkage, Tensile, etc.',
  fields: [
    { name: 'name', label: 'Parameter Name', type: 'text', required: true, placeholder: 'e.g. GSM' },
    { name: 'code', label: 'Param Code', type: 'text', placeholder: 'e.g. GSM' },
    { name: 'extra_field_1', label: 'Unit', type: 'text', placeholder: 'e.g. g/m²' },
    { name: 'extra_field_2', label: 'Standard Value', type: 'text', placeholder: 'e.g. 120' },
  ],
};

export const REMARKS_MASTER = {
  entity: 'remarks_master',
  title: 'Remarks Master',
  icon: BookOpen,
  color: '#65a30d',
  description: 'Predefined remark templates for forms and documents.',
  fields: [
    { name: 'name', label: 'Remark Text', type: 'text', required: true, placeholder: 'e.g. Goods received in good condition' },
    { name: 'code', label: 'Short Code', type: 'text', placeholder: 'e.g. GRC' },
  ],
};

export const DUTY_MASTER = {
  entity: 'duty_master',
  title: 'Duty Master',
  icon: Percent,
  color: '#059669',
  description: 'Custom duty rates for export/import transactions.',
  fields: [
    { name: 'name', label: 'Duty Type', type: 'text', required: true, placeholder: 'e.g. Basic Custom Duty' },
    { name: 'code', label: 'Duty Code', type: 'text', placeholder: 'e.g. BCD' },
    { name: 'extra_field_1', label: 'Rate (%)', type: 'text', placeholder: 'e.g. 10' },
  ],
};

export const WEAVING_MASTER = {
  entity: 'weaving_master',
  title: 'Weaving Master',
  icon: Layers,
  color: '#0f766e',
  description: 'Weave patterns and structures: Plain, Twill, Satin, Dobby.',
  fields: [
    { name: 'name', label: 'Weave Name', type: 'text', required: true, placeholder: 'e.g. 2/1 Twill' },
    { name: 'code', label: 'Weave Code', type: 'text', placeholder: 'e.g. TWL21' },
    { name: 'description', label: 'Notes', type: 'textarea' },
  ],
};


// ═══════════════════════════════════════════════════════════
//  PHASE 3 COMPLEX MASTERS (5 Masters)
// ═══════════════════════════════════════════════════════════

export const BUYER_KYC_FORM = {
  entity: 'buyer_kyc_form',
  title: 'Buyer KYC Form',
  icon: Shield,
  color: '#0284c7',
  description: 'Manage Buyer Know-Your-Customer (KYC) documentation and compliance status.',
  fields: [
    { name: 'name', label: 'Buyer Name', type: 'text', required: true, placeholder: 'e.g. Global Exim Corp' },
    { name: 'code', label: 'KYC Number', type: 'text', required: true, placeholder: 'e.g. KYC-2026-001' },
    { name: 'extra_field_1', label: 'GSTIN / Tax ID', type: 'text', placeholder: 'e.g. 33AABCC1234D1Z5' },
    { name: 'extra_field_2', label: 'PAN / Business Reg No', type: 'text', placeholder: 'e.g. ABCDE1234F' },
    { name: 'description', label: 'Verification Notes / Address', type: 'textarea' },
  ],
};

export const BUYER_SUB_MASTER = {
  entity: 'buyer_sub_master',
  title: 'Buyer Sub Master',
  icon: Users,
  color: '#4f46e5',
  description: 'Detailed sub-records and branch mappings for commercial buyers.',
  fields: [
    { name: 'name', label: 'Buyer Branch/Name', type: 'text', required: true, placeholder: 'e.g. Global Exim - London Office' },
    { name: 'code', label: 'Buyer Sub-Code', type: 'text', placeholder: 'e.g. BUY-001-LON' },
    { name: 'extra_field_1', label: 'Contact Person', type: 'text', placeholder: 'e.g. John Doe' },
    { name: 'extra_field_2', label: 'Email / Contact', type: 'text', placeholder: 'e.g. john@globalexim.com' },
  ],
};

export const COMPANY_BANK_MASTER = {
  entity: 'company_bank_master',
  title: 'Company Bank Master',
  icon: CreditCard,
  color: '#16a34a',
  description: 'Company bank accounts for receiving payments and printing on invoices.',
  fields: [
    { name: 'name', label: 'Bank Name', type: 'text', required: true, placeholder: 'e.g. State Bank of India' },
    { name: 'code', label: 'Account Number', type: 'text', required: true, placeholder: 'e.g. 12345678901' },
    { name: 'extra_field_1', label: 'IFSC Code', type: 'text', placeholder: 'e.g. SBIN0001234' },
    { name: 'extra_field_2', label: 'Branch & City', type: 'text', placeholder: 'e.g. Main Branch, Erode' },
  ],
};

export const LC_BANK_MASTER = {
  entity: 'lc_bank_master',
  title: 'LC Bank Master',
  icon: Factory,
  color: '#b45309',
  description: 'Letter of Credit (LC) issuing and advising banks for export trade.',
  fields: [
    { name: 'name', label: 'LC Bank Name', type: 'text', required: true, placeholder: 'e.g. HSBC London' },
    { name: 'code', label: 'Swift Code', type: 'text', placeholder: 'e.g. HSBCGB2Lxxx' },
    { name: 'extra_field_1', label: 'Branch / Address', type: 'text', placeholder: 'e.g. 8 Canada Square, London' },
  ],
};

export const FABRIC_COSTING_ENGINE = {
  entity: 'fabric_costing_engine',
  title: 'Fabric Costing Engine',
  icon: DollarSign,
  color: '#e11d48',
  description: 'Base costing structure, yarn inputs, and conversion pricing models per quality.',
  fields: [
    { name: 'name', label: 'Fabric Style / Quality Name', type: 'text', required: true, placeholder: 'e.g. Poplin 40s x 40s' },
    { name: 'code', label: 'Costing Ref ID', type: 'text', required: true, placeholder: 'e.g. CST-POP-01' },
    { name: 'extra_field_1', label: 'Estimated Rate/Mtr ($)', type: 'text', placeholder: 'e.g. 1.85' },
    { name: 'description', label: 'Detailed Cost Breakdown Details', type: 'textarea' },
  ],
};


// ═══════════════════════════════════════════════════════════
//  PHASE 3 AMENDMENT MASTERS (5 Masters)
// ═══════════════════════════════════════════════════════════

export const CLOTH_LOT_NO_AMD = {
  entity: 'cloth_lot_no_amd',
  title: 'Cloth LOT No. AMD',
  icon: ClipboardList,
  color: '#ea580c',
  description: 'Track and document amendments made to Cloth LOT Numbers.',
  fields: [
    { name: 'name', label: 'LOT Number', type: 'text', required: true, placeholder: 'e.g. LOT-2026-99' },
    { name: 'code', label: 'Amendment Ref No', type: 'text', placeholder: 'e.g. AMD-LOT-01' },
    { name: 'description', label: 'Reason for Lot Amendment', type: 'textarea', required: true },
  ],
};

export const INVOICE_AMD = {
  entity: 'invoice_amd',
  title: 'Invoice AMD',
  icon: FileText,
  color: '#84cc16',
  description: 'Log and authorize post-submission commercial invoice corrections.',
  fields: [
    { name: 'name', label: 'Invoice No', type: 'text', required: true, placeholder: 'e.g. DINV-26-0045' },
    { name: 'code', label: 'Amendment ID', type: 'text', placeholder: 'e.g. AMD-INV-02' },
    { name: 'description', label: 'Amendment Description', type: 'textarea', required: true },
  ],
};

export const DESPATCH_REQUEST_AMD = {
  entity: 'despatch_request_amd',
  title: 'Despatch Request AMD',
  icon: Truck,
  color: '#06b6d4',
  description: 'Manage changes to planned despatch requests and transporter allocations.',
  fields: [
    { name: 'name', label: 'Despatch Req No', type: 'text', required: true, placeholder: 'e.g. DR-00431' },
    { name: 'code', label: 'Amendment Ref', type: 'text', placeholder: 'e.g. AMD-DR-01' },
    { name: 'description', label: 'Detailed Reason for Transporter/Qty Change', type: 'textarea', required: true },
  ],
};

export const POINT_AMD = {
  entity: 'point_amd',
  title: 'Point AMD',
  icon: Target,
  color: '#7c3aed',
  description: 'Log adjustments to inspection point classifications.',
  fields: [
    { name: 'name', label: 'Point Allocation ID', type: 'text', required: true, placeholder: 'e.g. PT-882' },
    { name: 'code', label: 'Amendment Code', type: 'text', placeholder: 'e.g. AMD-PT-04' },
    { name: 'description', label: 'Reason for point value adjustment', type: 'textarea', required: true },
  ],
};

export const VENDOR_ORDER_AMD = {
  entity: 'vendor_order_amd',
  title: 'Vendor Order AMD',
  icon: ShoppingCart,
  color: '#ec4899',
  description: 'Amendments to outside supplier purchase orders and terms.',
  fields: [
    { name: 'name', label: 'Vendor Order No', type: 'text', required: true, placeholder: 'e.g. VPO-2026-11' },
    { name: 'code', label: 'Amendment Ref', type: 'text', placeholder: 'e.g. AMD-VPO-02' },
    { name: 'description', label: 'Reason for PO Amendment', type: 'textarea', required: true },
  ],
};


// ═══════════════════════════════════════════════════════════
//  PHASE 3 SYSTEM CONFIG & UTILITIES (6 Masters)
// ═══════════════════════════════════════════════════════════

export const APPROVAL_SETTINGS = {
  entity: 'approval_settings',
  title: 'Approval Settings',
  icon: Settings,
  color: '#059669',
  description: 'Configure standard multi-level approval hierarchies for orders, payments & costing.',
  fields: [
    { name: 'name', label: 'Workflow Name', type: 'text', required: true, placeholder: 'e.g. Buyer Order Approval' },
    { name: 'code', label: 'Approval Level Key', type: 'text', placeholder: 'e.g. LVL-2' },
    { name: 'description', label: 'Authorized Roles / Conditions', type: 'textarea' },
  ],
};

export const DIRECT_INVOICE_LIMITS = {
  entity: 'direct_invoice_limits',
  title: 'Direct Invoice Limits',
  icon: Percent,
  color: '#6366f1',
  description: 'System thresholds for invoice generation without pre-approved sales orders.',
  fields: [
    { name: 'name', label: 'User Role/Level', type: 'text', required: true, placeholder: 'e.g. Dispatch Manager' },
    { name: 'code', label: 'Limit Reference ID', type: 'text', placeholder: 'e.g. LIM-DS-01' },
    { name: 'extra_field_1', label: 'Maximum Invoice Limit (INR)', type: 'text', placeholder: 'e.g. 500000' },
  ],
};

export const SUB_MENU_MASTER = {
  entity: 'sub_menu_master',
  title: 'Sub Menu Master (Menu Builder)',
  icon: ClipboardList,
  color: '#a855f7',
  description: 'Dynamic UI navigation and sub-menu tree constructor registry.',
  fields: [
    { name: 'name', label: 'Menu/Sub-Menu Label', type: 'text', required: true, placeholder: 'e.g. Dyeing Quality Check' },
    { name: 'code', label: 'Route Path / Link', type: 'text', required: true, placeholder: 'e.g. /cloth/checking' },
    { name: 'extra_field_1', label: 'Parent Section Group', type: 'text', placeholder: 'e.g. Processing' },
  ],
};

export const CONTROL_SERVICE = {
  entity: 'control_service',
  title: 'Control Service (System Configuration)',
  icon: Shield,
  color: '#475569',
  description: 'Global system configuration keys, API parameters, and environment controls.',
  fields: [
    { name: 'name', label: 'Config Key Name', type: 'text', required: true, placeholder: 'e.g. GST_AUTO_CALCULATE' },
    { name: 'code', label: 'Config Value', type: 'text', required: true, placeholder: 'e.g. TRUE' },
    { name: 'description', label: 'Description & Scope of System Config', type: 'textarea' },
  ],
};

export const LOG_REPORT_UTIL = {
  entity: 'log_report_util',
  title: 'Log Report (Audit Trail)',
  icon: FileText,
  color: '#71717a',
  description: 'System actions log configuration and targeted module monitoring levels.',
  fields: [
    { name: 'name', label: 'Module To Audit', type: 'text', required: true, placeholder: 'e.g. accounts' },
    { name: 'code', label: 'Audit Severity level', type: 'text', placeholder: 'e.g. HIGH' },
    { name: 'description', label: 'Tracked Events details', type: 'textarea' },
  ],
};

export const OLD_YEAR_MENU = {
  entity: 'old_year_menu',
  title: 'Old Year Menu (Financial Year Switch)',
  icon: BookOpen,
  color: '#ca8a04',
  description: 'System year switch mapping to allow viewing or auditing past ledger periods.',
  fields: [
    { name: 'name', label: 'Financial Year Name', type: 'text', required: true, placeholder: 'e.g. FY 2024-2025' },
    { name: 'code', label: 'Ledger Code', type: 'text', placeholder: 'e.g. LEDG2425' },
    { name: 'extra_field_1', label: 'Database / Period Status', type: 'select', options: ['Locked (Read-Only)', 'Unlocked (Auditing)', 'Archived'] },
  ],
};


// ═══════════════════════════════════════════════════════════
//  ALL CONFIGS GROUPED FOR SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════

export const PHASE1_MASTERS = [
  CURRENCY_MASTER, UNIT_MASTER, YARN_TYPE_MASTER, YARN_COUNT_MASTER,
  COLOR_MASTER, DESIGN_TYPE_MASTER, PROCESS_TYPE_MASTER, HSN_CODE_MASTER,
  LOOM_MASTER, LOOM_TYPE_MASTER, PARTY_TYPE_GROUP, PAYMENT_TERMS_MASTER,
  GODOWN_MASTER, GATE_LOCATION_MASTER, MILL_NAME_MASTER, DISTRICT_CITY_MASTER,
  ORDER_TYPE_MASTER, SALES_REGION_MASTER,
];

export const PHASE2_MASTERS = [
  CHECKER_NAME_MASTER, GREY_CHECKER_NAME, CHECKING_TABLE_MACHINE,
  CATEGORY_MASTER, FABRIC_MASTER, CHEMICAL_GROUP_MASTER, SIZING_CHEMICAL_MASTER,
  DAMAGE_MASTER, DESIGN_COLOR_MASTER, FINISHING_TYPE_MASTER,
  PRINTING_TECHNIQUE_MASTER, PROCESS_SEQUENCES_MASTER,
  DEBIT_CREDIT_REASON_MASTER, EXPENSES_GROUP_HEAD, FIBRE_COUNT_MASTER,
  TDS_BILL_TYPE_MASTER, TEST_PARAMETER_MASTER, REMARKS_MASTER,
  DUTY_MASTER, WEAVING_MASTER,
];

export const COMPLEX_MASTERS = [
  BUYER_KYC_FORM, BUYER_SUB_MASTER, COMPANY_BANK_MASTER, LC_BANK_MASTER, FABRIC_COSTING_ENGINE
];

export const AMENDMENT_MASTERS = [
  CLOTH_LOT_NO_AMD, INVOICE_AMD, DESPATCH_REQUEST_AMD, POINT_AMD, VENDOR_ORDER_AMD
];

export const SYSTEM_CONFIG_MASTERS = [
  APPROVAL_SETTINGS, DIRECT_INVOICE_LIMITS, SUB_MENU_MASTER, CONTROL_SERVICE, LOG_REPORT_UTIL, OLD_YEAR_MENU
];

export const ALL_SUB_MASTERS = [
  ...PHASE1_MASTERS,
  ...PHASE2_MASTERS,
  ...COMPLEX_MASTERS,
  ...AMENDMENT_MASTERS,
  ...SYSTEM_CONFIG_MASTERS
];

