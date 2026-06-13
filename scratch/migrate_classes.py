import os
import re

directories = [
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/frontend/src/pages/HR",
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/frontend/src/pages/Vehicle management",
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/frontend/src/pages/stationary and consumptions",
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/frontend/cubebook-front/src/pages",
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/frontend/cubebook-front/src/components"
]

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Inputs, Selects, Textareas with Tailwind classes
    content = re.sub(
        r'className=["\']w-full\s+[^"\']*(?:rounded|border|px-\d|py-\d|focus:)[^"\']*["\']',
        'className="form-control"',
        content
    )
    
    # 2. Table tags
    content = re.sub(
        r'<table\s+className=["\'](?:w-full|min-w-full)[^"\']*["\']',
        '<table className="data-table"',
        content
    )
    
    # 3. Card divs
    content = re.sub(
        r'className=["\']bg-white\s+[^"\']*(?:rounded-|border|shadow|p-\d)[^"\']*["\']',
        'className="card"',
        content
    )
    
    # 4. Buttons
    # Primary (indigo, blue, purple, violet)
    content = re.sub(
        r'className=["\'][^"\']*(?:bg-(?:indigo|blue|purple|violet)-\d+|hover:bg-(?:indigo|blue|purple|violet)-\d+)[^"\']*["\']',
        'className="btn btn-primary"',
        content
    )
    # Success (green, emerald)
    content = re.sub(
        r'className=["\'][^"\']*(?:bg-(?:green|emerald)-\d+|hover:bg-(?:green|emerald)-\d+)[^"\']*["\']',
        'className="btn btn-success"',
        content
    )
    # Danger (red, rose)
    content = re.sub(
        r'className=["\'][^"\']*(?:bg-(?:red|rose)-\d+|hover:bg-(?:red|rose)-\d+)[^"\']*["\']',
        'className="btn btn-danger"',
        content
    )
    # Secondary (borders/white backgrounds)
    content = re.sub(
        r'className=["\'][^"\']*(?:border-(?:slate|gray|slate-\d+|gray-\d+)|hover:bg-(?:slate|gray)-\d+)[^"\']*["\']',
        'className="btn btn-secondary"',
        content
    )
    
    # 5. Form rows & grids
    content = re.sub(
        r'className=["\']grid\s+grid-cols-\d+[^"\']*["\']',
        'className="form-row"',
        content
    )
    
    # 6. Card Headers & Titles
    content = re.sub(
        r'className=["\']flex\s+items-center\s+justify-between\s+mb-\d+["\']',
        'className="card-header"',
        content
    )
    content = re.sub(
        r'className=["\']flex\s+justify-between\s+items-center\s+mb-\d+["\']',
        'className="card-header"',
        content
    )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

modified_count = 0
for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.jsx')):
                filepath = os.path.join(root, file)
                if migrate_file(filepath):
                    print(f"Migrated: {os.path.relpath(filepath, start='/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)')}")
                    modified_count += 1

print(f"Total modified files: {modified_count}")
