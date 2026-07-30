import os
import re

def ensure_icons(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the lucide-react import
    lucide_pattern = re.compile(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"];?", re.MULTILINE)
    match = lucide_pattern.search(content)
    
    if not match:
        return
        
    icons_str = match.group(1)
    icons = [i.strip() for i in icons_str.split(',')]
    
    required = ['Edit2', 'Trash2', 'Eye', 'X']
    changed = False
    
    for req in required:
        if req not in icons:
            icons.append(req)
            changed = True
            
    if changed:
        # filter out empty strings just in case
        icons = [i for i in icons if i]
        new_import = "import { " + ", ".join(sorted(set(icons))) + " } from 'lucide-react';\n"
        content = content[:match.start()] + new_import + content[match.end():]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added missing icons to {file_path}")

target_dir = r"src/pages/stationary and consumptions"
for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.jsx'):
            ensure_icons(os.path.join(root, file))

