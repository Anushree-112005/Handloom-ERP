import re
import os
import glob

def fix_lucide_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all lucide-react imports
    # Handle multi-line imports
    lucide_pattern = re.compile(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"];?", re.MULTILINE)
    matches = lucide_pattern.findall(content)
    
    if not matches:
        return
        
    all_icons = set()
    for match in matches:
        icons = [i.strip() for i in match.split(',')]
        for icon in icons:
            if icon:
                all_icons.add(icon)
                
    if not all_icons:
        return
        
    # Replace all existing lucide imports with empty string
    content = lucide_pattern.sub("", content)
    
    # Generate new import
    new_import = "import { " + ", ".join(sorted(list(all_icons))) + " } from 'lucide-react';\n"
    
    # Add new import right after the first line (or react import)
    react_import_pattern = re.compile(r"import React[^;]+;")
    react_match = react_import_pattern.search(content)
    
    if react_match:
        content = content[:react_match.end()] + "\n" + new_import + content[react_match.end():]
    else:
        content = new_import + content
        
    # Remove double blank lines that might have been created
    content = re.sub(r'\n{3,}', '\n\n', content)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed imports in {file_path}")

target_dir = r"src/pages/stationary and consumptions"
for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.jsx'):
            fix_lucide_imports(os.path.join(root, file))

