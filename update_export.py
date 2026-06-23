import os
import re

FILES = [
    "frontend/src/pages/purchase_orders/ClothPurchasePO.jsx",
    "frontend/src/pages/purchase_orders/ProcessingPO.jsx",
    "frontend/src/pages/purchase_orders/WeavingPO.jsx",
    "frontend/src/pages/purchase_orders/WarpingSizingPO.jsx",
    "frontend/src/pages/purchase_orders/FabricDyeingPO.jsx",
    "frontend/src/pages/purchase_orders/YarnDyeingPO.jsx",
    "frontend/src/pages/purchase_orders/TwistingDoublingPO.jsx"
]

IMPORTS = """
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
"""

EXPORT_LOGIC = """
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`Dinesh Textile - ${title}`, 14, 15);
    const headers = [["PO No", "Date", "Supplier", "Amount", "Status"]];
    const rows = filteredOrders.map(o => [
      o.po_no || o.po_number || '-',
      o.po_date || '-',
      o.supplier_name || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit || '-',
      `Rs. ${o.net_amount?.toFixed(2) || '0.00'}`,
      o.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(o => ({
      "PO No": o.po_no || o.po_number,
      "Date": o.po_date,
      "Supplier": o.supplier_name || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit,
      "Amount": o.net_amount,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredOrders ="""

NEW_BUTTONS = """
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Export
                </button>
                {showExportMenu && (
                  <>
                    <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                      <button onClick={() => { setShowExportMenu(false); exportPDF(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FileText size={16} color="#ef4444" /> PDF Report
                      </button>
                      <button onClick={() => { setShowExportMenu(false); exportExcel(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Table size={16} color="#10b981" /> Excel Export
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={18} /> New Order
              </button>
            </div>
          </div>"""

for filepath in FILES:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}")
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Add jsPDF and XLSX imports
    if 'jspdf' not in content:
        content = re.sub(
            r"import React[^;]+;",
            lambda m: m.group(0) + "\n" + IMPORTS.strip(),
            content,
            count=1
        )

    # 2. Add Download, Table, FileText to lucide-react imports if missing
    import_match = re.search(r"import \{([^}]+)\} from 'lucide-react';", content)
    if import_match:
        lucide_icons = [i.strip() for i in import_match.group(1).split(',')]
        if 'Download' not in lucide_icons:
            lucide_icons.append('Download')
        if 'Table' not in lucide_icons:
            lucide_icons.append('Table')
        if 'FileText' not in lucide_icons:
            lucide_icons.append('FileText')
        new_import_str = "import { " + ", ".join(lucide_icons) + " } from 'lucide-react';"
        content = content.replace(import_match.group(0), new_import_str)

    # 3. Add export functions right before `const filteredOrders =`
    if 'exportPDF' not in content:
        content = content.replace("  const filteredOrders =", EXPORT_LOGIC)

    # 4. Replace the old New Order button with the new grouped buttons
    old_button_pattern = r'<\s*button\s+className="btn btn-primary"\s+onClick=\{[^\}]+\}\s*>\s*<Plus\s+size=\{18\}\s*/>\s*New Order\s*</button>\s*</div>'
    content = re.sub(old_button_pattern, NEW_BUTTONS.strip(), content)

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")
