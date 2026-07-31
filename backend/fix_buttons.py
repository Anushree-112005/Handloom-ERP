import re

files = [
    r"frontend\src\pages\stationary and consumptions\RequestApproval.jsx",
    r"frontend\src\pages\stationary and consumptions\POApproval.jsx",
    r"frontend\src\pages\stationary and consumptions\IssueApproval.jsx"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = r'<button onClick=\{\(\) => \{ (setSelected[a-zA-Z0-9_]+\([a-zA-Z0-9_]+\);\s*setView\(''form''\);) \}\} className="btn btn-outline"([^>]+)>\s*<Eye size=\{14\} /> Review\s*</button>'
    
    def replacer(match):
        action = match.group(1)
        return f\'\'\'<button onClick={{() => {{ {action} }}}} className="btn btn-secondary" style={{{{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}}} title="Edit"><Edit2 size={{16}} color="var(--text-primary)" /></button>\n                          <button className="btn btn-secondary" style={{{{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}}} title="Delete"><Trash2 size={{16}} color="#ef4444" /></button>\'\'\'

    new_content, count = re.subn(pattern, replacer, content)
    
    if count > 0:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"Pattern not found in {file_path}")
