import os

files_to_fix = [
    "frontend/src/pages/purchase_orders/TwistingDoublingPO.jsx",
    "frontend/src/pages/purchase_orders/YarnDyeingPO.jsx",
    "frontend/src/pages/purchase_orders/FabricDyeingPO.jsx",
    "frontend/src/pages/purchase_orders/WarpingSizingPO.jsx",
    "frontend/src/pages/purchase_orders/WeavingPO.jsx",
    "frontend/src/pages/purchase_orders/ProcessingPO.jsx",
    "frontend/src/pages/purchase_orders/ClothPurchasePO.jsx",
]

for fpath in files_to_fix:
    with open(fpath, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if "borderRight: '1px solid var(--border)'," in line:
            continue # Remove this line
        
        if "background: '#f8fafc', overflowX: 'auto'" in line:
            line = line.replace("background: '#f8fafc', overflowX: 'auto'", "background: 'var(--bg-primary)', overflowX: 'auto'")
        
        if "padding: '14px 24px'," in line:
            line = line.replace("padding: '14px 24px',", "padding: '16px 24px',")
            
        if "background: activeSection === tab.id ? '#fff' : '#f8fafc'," in line:
            line = line.replace("background: activeSection === tab.id ? '#fff' : '#f8fafc',", "background: activeSection === tab.id ? '#fff' : 'transparent',")
            
        if "color: activeSection === tab.id ? 'var(--primary)' : '#64748b'," in line:
            line = line.replace("color: activeSection === tab.id ? 'var(--primary)' : '#64748b',", "color: activeSection === tab.id ? 'var(--primary)' : 'var(--text-muted)',")
            
        if "borderBottom: activeSection === tab.id ? '2px solid var(--primary)' : '2px solid transparent'," in line:
            line = line.replace("borderBottom: activeSection === tab.id ? '2px solid var(--primary)' : '2px solid transparent',", "borderBottom: activeSection === tab.id ? '3px solid var(--primary)' : '3px solid transparent',")
            
        new_lines.append(line)
        
    with open(fpath, 'w') as f:
        f.writelines(new_lines)

print("Line by line replacement done.")
