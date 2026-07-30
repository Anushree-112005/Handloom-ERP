import os
import glob

def fix_paths(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace ../../components with ../../../components
    content = content.replace("'../../components/A4DocumentPreview'", "'../../../components/A4DocumentPreview'")
    content = content.replace('"../../components/A4DocumentPreview"', '"../../../components/A4DocumentPreview"')
    
    # Replace ../../assets with ../../../assets
    content = content.replace("'../../assets/logo.png'", "'../../../assets/logo.png'")
    content = content.replace('"../../assets/logo.png"', '"../../../assets/logo.png"')
    
    # Also in the JSX block where logoImg is used: src={logoImg} is fine because it imports it.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed paths in {file_path}")

target_dir = r"src/pages/stationary and consumptions/reports"
for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.jsx'):
            fix_paths(os.path.join(root, file))

