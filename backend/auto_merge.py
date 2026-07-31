import os
import subprocess

def resolve_shared(filepath):
    print(f"Resolving shared file: {filepath}")
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    out = []
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            continue
        elif line.startswith('======='):
            continue
        elif line.startswith('>>>>>>>'):
            continue
        else:
            out.append(line)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(out)
        
    subprocess.run(["git", "add", filepath], check=True)

def resolve_theirs(filepath):
    print(f"Resolving using theirs: {filepath}")
    if not os.path.exists(filepath):
        return
    subprocess.run(["git", "checkout", "--theirs", filepath], check=True)
    subprocess.run(["git", "add", filepath], check=True)

# Shared files (Keep both your changes and Bala's changes)
shared_files = [
    "backend/app/api/v1/router.py",
    "backend/app/models/__init__.py",
    "backend/app/api/v1/endpoints/dashboard.py",
    "backend/scripts/seed_party_master.py",
    "frontend/src/App.jsx",
    "frontend/src/components/Header.jsx",
    "frontend/src/components/Sidebar.jsx",
    "frontend/src/index.css",
    "frontend/src/pages/dashboard/Dashboard.jsx",
    "frontend/src/pages/party_master/PartyMaster.jsx",
    "frontend/src/services/api.js",
    "README.md"
]

for sf in shared_files:
    resolve_shared(sf)

# PPC specific files (Accept Bala's version since he built the PPC module)
ppc_files = [
    "backend/app/api/v1/endpoints/ppc.py",
    "backend/app/models/ppc.py",
    "backend/app/schemas/ppc.py",
]

for pf in ppc_files:
    resolve_theirs(pf)

# Accept Bala's version for ALL files in the frontend PPC directory
ppc_dir = "frontend/src/pages/ppc"
if os.path.exists(ppc_dir):
    for root, dirs, files in os.walk(ppc_dir):
        for file in files:
            filepath = os.path.join(root, file)
            # Standardize path for git
            filepath = filepath.replace("\\", "/")
            resolve_theirs(filepath)
            
print("======================================")
print("Merge conflict resolution complete! ✨")
print("You can now run `git commit -m \"Merge bala branch\"` to finalize the merge.")
print("======================================")
