import os
import re

directory = "c:\\Users\\User\\Desktop\\dinesh-tex\\dinesh-tex\\frontend\\src\\finance_module\\pages"

target_class = "className=\"flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm\""
target_class_alt = "className=\"self-start md:self-auto flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm\""

new_class = "className=\"flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm\""
new_class_alt = "className=\"self-start md:self-auto flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm\""


for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".jsx"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # The pattern looks for the export button specifically.
            # We will use regex to find `<button ... className="..." ...> \n <Download .../> Export`
            
            # Since the button might be structured differently, let's just do a string replace
            # for the specific lines that precede the Download icon.
            
            # A safer way is to find `<Download size={13} /> Export PDF` and replace the class of its parent button.
            # Let's just use regex to replace the class name of any button that contains "Export PDF" or "Export"
            
            # Find all buttons
            pattern = re.compile(r'<button\s+[^>]*?onClick=\{[^}]*?exportToPDF[^}]*?\}[^>]*?className="([^"]+)"[^>]*>', re.DOTALL)
            
            def replacer(match):
                full_match = match.group(0)
                old_cls = match.group(1)
                
                if 'md:self-auto' in old_cls:
                    new_cls = "self-start md:self-auto flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
                else:
                    new_cls = "flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
                    
                return full_match.replace(old_cls, new_cls)

            new_content = pattern.sub(replacer, content)
            
            if content != new_content:
                print(f"Updated {file}")
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
