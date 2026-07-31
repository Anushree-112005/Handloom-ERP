import re
file_path = r'c:\Users\Welcome\Desktop\Navani\dinesh_txt\frontend\src\pages\costing_sheet\CostingSheetModule.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r"\'", "'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed quotes!')
