import os
import re

directory = "frontend/src/pages"

def process_file(filepath):
    if "YarnPurchaseOrder.jsx" in filepath:
        return
        
    with open(filepath, "r") as f:
        content = f.read()

    # Find buttons that contain <Eye 
    pattern = r'(<button\s+[^>]*?className="btn btn-secondary"[^>]*?style={{[^}]+}}([^>]*?)>)\s*<Eye[^>]+/>\s*(</button>)'
    
    def replacer(match):
        start_tag = match.group(1)
        start_tag = re.sub(r'style={{[^}]+}}', "style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}", start_tag)
        return f'{start_tag}\n  <Eye size={{16}} color="var(--primary)" />\n</button>'

    new_content = re.sub(pattern, replacer, content)

    pattern2 = r'(<button\s+[^>]*?className="btn btn-secondary"(?![^>]*style=)[^>]*?)>\s*<Eye[^>]+/>\s*(</button>)'
    def replacer2(match):
        start_tag = match.group(1)
        start_tag += " style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}"
        return f'{start_tag}>\n  <Eye size={{16}} color="var(--primary)" />\n</button>'
        
    new_content = re.sub(pattern2, replacer2, new_content)

    # Some might not have className="btn btn-secondary" but we want to change any Eye button that's used for viewing.
    # Let's focus on btn-secondary for now.

    if new_content != content:
        with open(filepath, "w") as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".jsx"):
            process_file(os.path.join(root, file))
