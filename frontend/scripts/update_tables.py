import os
import re

TARGET_THEAD = 'className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90"'

def walk_dir(directory):
    matches = []
    for root, dirnames, filenames in os.walk(directory):
        if 'node_modules' in dirnames:
            dirnames.remove('node_modules')
        if 'venv' in dirnames:
            dirnames.remove('venv')
        if '.git' in dirnames:
            dirnames.remove('.git')
        for filename in filenames:
            if filename.endswith('.jsx'):
                matches.append(os.path.join(root, filename))
    return matches

files = walk_dir('c:/Users/User/Desktop/dinesh-tex/dinesh-tex/frontend/src')
count = 0

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Replace <thead className="...">
    content = re.sub(r'<thead\s+className=["\'][^"\']*["\']', f'<thead {TARGET_THEAD}', content)
    
    # Replace <thead style="...">
    content = re.sub(r'<thead\s+style=\{[^}]+\}', f'<thead {TARGET_THEAD}', content)
    
    # Standardize row hovers (find hover:bg-[color]-[num] and replace with hover:bg-purple-50/15 transition-colors)
    def replace_hover(match):
        cls = match.group(1)
        cls = re.sub(r'hover:bg-[a-z]+-?[0-9]*/?\d*', 'hover:bg-purple-50/15', cls)
        if 'transition-colors' not in cls:
            cls += ' transition-colors'
        return f'className="{cls}"'
        
    content = re.sub(r'className=["\']([^"\']*hover:bg-[a-z]+-?[0-9]*/?\d*[^"\']*)["\']', replace_hover, content)

    # Standardize specific grid headers (LedgerReport, CashAndBankBook)
    # find className="grid grid-cols-... bg-slate-50 border-b border-slate-200..."
    # LedgerReport uses text-[10px] uppercase text-slate-400 bg-slate-50 border-b border-slate-200 sticky top-0 z-10
    # Let's add backdrop-blur-sm bg-slate-50/90 to grid headers
    def replace_grid_header(match):
        cls = match.group(1)
        if 'backdrop-blur-sm bg-slate-50/90' not in cls:
            cls += ' backdrop-blur-sm bg-slate-50/90'
        return f'className="{cls}"'
        
    content = re.sub(r'className=["\']([^"\']*grid[^"\']*sticky top-0 z-10[^"\']*)["\']', replace_grid_header, content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
        count += 1

print(f"Total files updated: {count}")
