import re
import os

def patch_file(file_path, module_title):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already patched
    if "downloadElementAsPdf" in content and "InfoRow2" in content:
        return

    # 1. Update React imports
    if "import React, { useState, useEffect }" in content:
        content = content.replace("import React, { useState, useEffect }", "import React, { useState, useEffect, useRef }")

    # 2. Add imports
    extra_imports = """import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';
import { User, Phone, MapPin, IndianRupee, Briefcase, FileText, Download, Eye, Edit2, Trash2, X } from 'lucide-react';
"""
    if "downloadElementAsPdf" not in content:
        content = content.replace("export default function", extra_imports + "\nexport default function")

    # Add InfoRow2
    info_row = """
const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);
"""
    if "const InfoRow2" not in content:
        content = content.replace("export default function", info_row + "\nexport default function")

    # 3. Add states
    if "selectedViewItem" not in content:
        match = re.search(r'const \[.*?, .*?\] = useState\(.*?\);', content)
        if match:
            states_code = """
  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };
"""
            content = content[:match.end()] + "\n" + states_code + content[match.end():]

    # 4. Modify action buttons! (Safely)
    # We will ONLY look for tables that have `handleOpenForm` or `handleEditQuotation` or `handleEditX`
    
    # We find all <button ... title="Edit"> or title="Delete" and standardise them.
    # Wait, the best way to prepend the Eye icon is to look for the Edit button.
    # We can use regex to find: <button[^>]*onClick=\{\(\)\s*=>\s*handle[A-Za-z0-9_]+\(([^)]+)\)\}[^>]*>\s*<Edit[A-Za-z0-9_]*[^>]*/>[^<]*</button>
    
    def edit_replacer(m):
        full_edit_btn = m.group(0)
        var = m.group(1).split(',')[0].strip()
        # Create standard Eye button
        eye_btn = f'<button className="btn btn-secondary" style={{{{ padding: \'6px\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\' }}}} onClick={{() => setSelectedViewItem({var})}} title="Preview"><Eye size={{16}} color="var(--primary)" /></button>'
        
        # Standardise the Edit button
        new_edit_btn = f'<button className="btn btn-secondary" style={{{{ padding: \'6px\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\' }}}} onClick={{{m.group(2)}}} title="Edit"><Edit2 size={{16}} /></button>'
        
        return eye_btn + "\n" + new_edit_btn

    # Regex for Edit button
    edit_pattern = re.compile(r'<button[^>]*onClick=\{([^}]+handle[A-Za-z0-9_]*\(([^)]+)\)[^}]+)\}[^>]*>\s*<Edit[A-Za-z0-9_]*[^>]*/>[^<]*</button>')
    content = edit_pattern.sub(edit_replacer, content)
    
    # Regex for Delete button
    def delete_replacer(m):
        return f'<button className="btn btn-secondary" style={{{{ padding: \'6px\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\' }}}} onClick={{{m.group(1)}}} title="Delete"><Trash2 size={{16}} color="var(--danger, #ef4444)" /></button>'
    
    del_pattern = re.compile(r'<button[^>]*onClick=\{([^}]+handleDelete[A-Za-z0-9_]*\([^)]+\)[^}]+)\}[^>]*>\s*<Trash2?[^>]*/>[^<]*</button>')
    content = del_pattern.sub(delete_replacer, content)

    # For files that only have Review/Approve buttons (like RequestApproval), they might not have an Edit button.
    # Let's find: <button[^>]*onClick=\{\(\)\s*=>\s*\{\s*setSelected[A-Za-z0-9_]+\(([^)]+)\);\s*setView\('form'\);\s*\}\}[^>]*>
    def review_replacer(m):
        var = m.group(1).strip()
        eye_btn = f'<button className="btn btn-secondary" style={{{{ padding: \'6px\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\' }}}} onClick={{() => setSelectedViewItem({var})}} title="Preview"><Eye size={{16}} color="var(--primary)" /></button>'
        # Keep original review button but standardise its style? Or just prepend Preview.
        return eye_btn + "\n" + m.group(0)

    rev_pattern = re.compile(r'<button[^>]*onClick=\{\(\)\s*=>\s*\{\s*setSelected[A-Za-z0-9_]+\(([^)]+)\);\s*setView\(\'form\'\);\s*\}\}[^>]*>.*?Review.*?</button>', re.DOTALL)
    content = rev_pattern.sub(review_replacer, content)

    # 5. Append Modal at the very end before the last </div>
    modal_code = """
      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} /> 
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>__MODULE_TITLE__ Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>
                
                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                         <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                         <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>__MODULE_TITLE_UPPER__</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                <div style={{ padding: '10px 40px 40px 40px' }}>
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 5).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(5, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""
    modal_code = modal_code.replace("__MODULE_TITLE__", module_title)
    modal_code = modal_code.replace("__MODULE_TITLE_UPPER__", module_title.upper())

    if "{/* Preview Modal */}" not in content:
        if "    </div>\n  );\n}" in content:
            content = content.replace("    </div>\n  );\n}", modal_code)
        elif "    </div >\n  );\n}" in content:
            content = content.replace("    </div >\n  );\n}", modal_code.replace("    </div>\n  );\n}", "    </div >\n  );\n}"))
        elif "    </div>\n  )\n}" in content:
            content = content.replace("    </div>\n  )\n}", modal_code)
        else:
            idx = content.rfind("</div>\n  );\n}")
            if idx != -1:
                content = content[:idx] + modal_code
            else:
                idx2 = content.rfind("</div>\n  )\n}")
                if idx2 != -1:
                    content = content[:idx2] + modal_code

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {file_path}")

files_to_patch = {
    'src/pages/stationary and consumptions/CategoryMaster.jsx': 'Category Master',
    'src/pages/stationary and consumptions/UOMMaster.jsx': 'UOM Master',
    'src/pages/stationary and consumptions/VendorMaster.jsx': 'Vendor Master',
    'src/pages/stationary and consumptions/DepartmentMaster.jsx': 'Department Master',
    'src/pages/stationary and consumptions/ItemMaster.jsx': 'Item Master',
    'src/pages/stationary and consumptions/MaterialRequest.jsx': 'Department Request',
    'src/pages/stationary and consumptions/PurchaseRequisition.jsx': 'Purchase Requisition',
    'src/pages/stationary and consumptions/QuotationEntry.jsx': 'Vendor Quotation',
    'src/pages/stationary and consumptions/PurchaseOrder.jsx': 'Purchase Order',
    'src/pages/stationary and consumptions/GRNStockInward.jsx': 'Stock Inward (GRN)',
    'src/pages/stationary and consumptions/IssueEntry.jsx': 'Issue to Dept',
    'src/pages/stationary and consumptions/ReturnEntry.jsx': 'Return to Store',
    'src/pages/stationary and consumptions/TransferEntry.jsx': 'Store Transfer',
    'src/pages/stationary and consumptions/AdjustmentEntry.jsx': 'Stock Adjustment',
    'src/pages/stationary and consumptions/ReturnableDCManagement.jsx': 'Returnable DC',
    'src/pages/stationary and consumptions/reports/POPrintReport.jsx': 'Purchase Order Print',
    'src/pages/stationary and consumptions/reports/POStatusReport.jsx': 'PO Status Report',
    'src/pages/stationary and consumptions/reports/PurchaseReceivedReport.jsx': 'Purchase Received Report',
    'src/pages/stationary and consumptions/reports/ConsumptionReport.jsx': 'Consumption Report',
    'src/pages/stationary and consumptions/reports/StockReport.jsx': 'Stock Report',
    'src/pages/stationary and consumptions/RequestApproval.jsx': 'Request Approval',
    'src/pages/stationary and consumptions/POApproval.jsx': 'PO Approval',
    'src/pages/stationary and consumptions/IssueApproval.jsx': 'Issue Approval'
}

for path, title in files_to_patch.items():
    if os.path.exists(path):
        patch_file(path, title)

