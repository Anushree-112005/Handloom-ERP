import os
import re

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
        content = f.read()
    
    # 1. Container background
    content = re.sub(r"background:\s*'#f8fafc',\s*overflowX:\s*'auto'", "background: 'var(--bg-primary)', overflowX: 'auto'", content)
    
    # 2. Tabs style padding
    content = re.sub(r"padding:\s*'14px 24px',", "padding: '16px 24px',", content)
    
    # 3. Tabs style background
    content = re.sub(r"background:\s*activeSection === tab\.id \? '#fff' : '#f8fafc',", "background: activeSection === tab.id ? '#fff' : 'transparent',", content)
    
    # 4. Remove borderRight completely
    content = re.sub(r"borderRight:\s*'1px solid var\(--border\)',\s*", "", content)
    
    # 5. Color
    content = re.sub(r"color:\s*activeSection === tab\.id \? 'var\(--primary\)' : '#64748b',", "color: activeSection === tab.id ? 'var(--primary)' : 'var(--text-muted)',", content)
    
    # 6. BorderBottom thickness
    content = re.sub(r"borderBottom:\s*activeSection === tab\.id \? '2px solid var\(--primary\)' : '2px solid transparent',", "borderBottom: activeSection === tab.id ? '3px solid var(--primary)' : '3px solid transparent',", content)
    
    with open(fpath, 'w') as f:
        f.write(content)

print("All replacements done with robust regex.")
