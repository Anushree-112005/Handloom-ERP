import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Layers, FileDigit, Briefcase
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SalesFinanceDesk({ defaultSection = 'Bills & Approvals' }) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(defaultSection);
  const [activePage, setActivePage] = useState(null);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  // Dynamic fields
  const [fields, setFields] = useState({});

  useEffect(() => {
    setActiveSection(defaultSection);
    const firstSubModule = Object.values(PAGES_METADATA).find(p => p.category === defaultSection);
    if (firstSubModule) {
      setActivePage(firstSubModule.key);
    } else {
      setActivePage(null);
    }
    setIsFormOpen(false);
  }, [defaultSection]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields({
      ...fields,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const PAGES_METADATA = {
    // 1. Bills & Approvals
    creditors_bills: { key: 'creditors_bills', label: "Creditors Bills Received", category: 'Bills & Approvals', desc: "Record bills received from all creditors", icon: Receipt, color: '#3b82f6' },
    general_bills: { key: 'general_bills', label: "General/Other Bills", category: 'Bills & Approvals', desc: "Enter miscellaneous and general bills", icon: FileText, color: '#3b82f6' },
    creditors_approval: { key: 'creditors_approval', label: "Creditors Bills Approval", category: 'Bills & Approvals', desc: "Approve bills received from creditors", icon: CheckSquare, color: '#3b82f6' },
    creditors_debit: { key: 'creditors_debit', label: "Creditors Debit Note", category: 'Bills & Approvals', desc: "Generate debit notes against creditors", icon: AlertTriangle, color: '#3b82f6' },

    // 2. Sales Invoices
    export_invoice: { key: 'export_invoice', label: "Export Invoice", category: 'Sales Invoices', desc: "Generate invoices for export shipments", icon: Globe, color: '#10b981' },
    direct_sales_inv: { key: 'direct_sales_inv', label: "Direct Sales Invoice", category: 'Sales Invoices', desc: "Create direct domestic sales invoices", icon: FileDigit, color: '#10b981' },
    direct_einvoice: { key: 'direct_einvoice', label: "Direct Sales EInvoice", category: 'Sales Invoices', desc: "Generate E-Invoice for direct sales", icon: Sparkles, color: '#10b981' },
    tally_export: { key: 'tally_export', label: "Tally Sales Export", category: 'Sales Invoices', desc: "Export sales invoices to Tally ERP", icon: Download, color: '#10b981' },
    cancel_invoice: { key: 'cancel_invoice', label: "Cancel Sales Invoice", category: 'Sales Invoices', desc: "Void or cancel issued sales invoices", icon: X, color: '#10b981' },

    // 3. Sales Amendments
    sales_amendment: { key: 'sales_amendment', label: "Sales Amendment", category: 'Sales Amendments', desc: "Amend details of standard sales invoices", icon: Edit, color: '#f59e0b' },
    gry_amendment: { key: 'gry_amendment', label: "Gry Sales Amendment", category: 'Sales Amendments', desc: "Amend details for greige sales invoices", icon: Settings, color: '#f59e0b' },

    // 4. LC Management
    lc_detail: { key: 'lc_detail', label: "LC Detail", category: 'LC Management', desc: "Manage Letter of Credit (LC) master data", icon: Briefcase, color: '#8b5cf6' },
    lc_hundi: { key: 'lc_hundi', label: "LC Hundi Entry", category: 'LC Management', desc: "Record LC Hundi financial transactions", icon: FileText, color: '#8b5cf6' },
    bulk_invoice_print: { key: 'bulk_invoice_print', label: "Bulk Invoice Print", category: 'LC Management', desc: "Print multiple LC invoices in bulk", icon: Printer, color: '#8b5cf6' },
    lc_completion: { key: 'lc_completion', label: "LC Completion", category: 'LC Management', desc: "Mark Letter of Credit as completed", icon: CheckSquare, color: '#8b5cf6' }
  };

  const handleOpenPage = (p) => {
    setActivePage(p.key);
    setIsFormOpen(false);
  };

  const handleCreateNew = () => {
    const nextId = `DOC-2026-${Math.floor(Math.random() * 10000)}`;
    setCurrentFormId(nextId);
    setFields({ id: nextId, date: new Date().toISOString().substring(0, 10), remarks: '' });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsFormOpen(false);
    alert("Record processed and saved!");
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      {!isFormOpen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={24} color="#8b5cf6" /> {activeSection}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Manage {activeSection.toLowerCase()} operations, approvals, and records.
            </p>
          </div>
        </div>
      )}

      {/* STAT CARDS ACTING AS SUB-MODULE SWITCHERS */}
      {!isFormOpen && (
        <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', gap: 16, marginBottom: 24, paddingBottom: 8 }}>
          {Object.values(PAGES_METADATA)
            .filter(p => p.category === activeSection)
            .map(p => {
              const IconComp = p.icon;
              const cardColor = p.color || '#3b82f6';
              const r = parseInt(cardColor.slice(1, 3), 16);
              const g = parseInt(cardColor.slice(3, 5), 16);
              const b = parseInt(cardColor.slice(5, 7), 16);
              const isSelected = activePage === p.key;

              return (
                <div 
                  key={p.key}
                  onClick={() => handleOpenPage(p)}
                  className="card"
                  style={{
                    flex: '1 0 220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 16,
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${cardColor}` : '1px solid var(--border)',
                    background: isSelected ? `rgba(${r},${g},${b}, 0.05)` : 'var(--bg-secondary)',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? `0 10px 15px -3px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 10, background: cardColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(0,0,0,0.15)` }}>
                      <IconComp size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                         <span style={{ fontWeight: 800, color: cardColor }}>-</span> Records
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* SUB PAGE WORKSPACE CONTAINER */}
      {activePage && (
        <>
          {!isFormOpen ? (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, overflowX: 'auto' }}>
                <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                      {PAGES_METADATA[activePage].label} Records Audit
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Central ledger logs for tracking financial documents</span>
                  </div>
                  <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                    <Plus size={16} /> Log New {PAGES_METADATA[activePage].label}
                  </button>
                </div>

                <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'white' }}>
                  <Sparkles size={36} style={{ color: '#8b5cf6', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 800, margin: 0 }}>Financial Ledger Active</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Record sheets and dynamic tables are loaded in standard secure sandboxed modules. Click "Log New Record" to populate details.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card animate-fade" style={{ padding: '32px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                    {PAGES_METADATA[activePage].label} Voucher Entry — {currentFormId}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure financial record tracking system</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <X size={15} /> Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                    <Check size={15} /> Save Record
                  </button>
                </div>
              </div>

              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label>Voucher Ref No</label>
                    <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                  </div>
                  <div className="form-group">
                    <label>Record Category</label>
                    <input type="text" className="form-control" value={PAGES_METADATA[activePage].label} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" className="form-control" name="date" value={fields.date || ''} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description / Remarks *</label>
                  <textarea className="form-control" rows="4" name="remarks" placeholder="Enter logs..." value={fields.remarks || ''} onChange={handleInputChange} required />
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
