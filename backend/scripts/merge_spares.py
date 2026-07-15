import re

with open('frontend/src/pages/spares/SparesMaster.jsx', 'r') as f:
    master_content = f.read()

with open('frontend/src/pages/spares/SparesTransaction.jsx', 'r') as f:
    trans_content = f.read()

# 1. Extract states
state_match = re.search(r'(// 1\. SECTION MASTER DATA & FORM STATE.*?// Filtered lists)', master_content, re.DOTALL)
if state_match:
    states = state_match.group(1)
    # Insert after static references
    trans_content = trans_content.replace('// 1. OPENING STOCK DATA', states + '\n  // 1. OPENING STOCK DATA')

# 2. Extract handleCreateNew
create_new_match = re.search(r'const handleCreateNew = \(\) => \{.*?if \(activeTab === \'Sections\'\) \{.*?} else \{.*?\}', master_content, re.DOTALL)
if create_new_match:
    create_new_logic = create_new_match.group(0).replace('const handleCreateNew = () => {', '').replace('setCurrentFormId(nextId);\n    setActiveFormTab(\'General Info\');\n    setIsFormOpen(true);\n  };', '')
    
    trans_content = trans_content.replace('if (activeTab === \'OpeningStock\') {', create_new_logic + '\n    if (activeTab === \'OpeningStock\') {')

# 3. Extract handleSave
save_match = re.search(r'const handleSave = \(e\) => \{.*?if \(activeTab === \'Sections\'\) \{.*?} else \{.*?\}', master_content, re.DOTALL)
if save_match:
    save_logic = save_match.group(0).replace('const handleSave = (e) => {\n    e.preventDefault();\n', '').replace('setIsFormOpen(false);\n    alert("Master Record saved successfully!");\n  };', '')
    trans_content = trans_content.replace('if (activeTab === \'OpeningStock\') {', save_logic + '\n    if (activeTab === \'OpeningStock\') {')

# 4. Extract handleEdit
edit_match = re.search(r'const handleEdit = \(row\) => \{.*?if \(activeTab === \'Sections\'\) \{.*?} else \{.*?\}', master_content, re.DOTALL)
if edit_match:
    edit_logic = edit_match.group(0).replace('const handleEdit = (row) => {\n    setCurrentFormId(row.id);\n', '').replace('setActiveFormTab(\'General Info\');\n    setIsFormOpen(true);\n  };', '')
    trans_content = trans_content.replace('if (activeTab === \'OpeningStock\') {', edit_logic + '\n    if (activeTab === \'OpeningStock\') {')

# 5. Extract handleDelete
del_match = re.search(r'const handleDelete = \(id\) => \{.*?if \(activeTab === \'Sections\'\) setSections.*?else setSpares.*?\}', master_content, re.DOTALL)
if del_match:
    del_logic = del_match.group(0).replace('const handleDelete = (id) => {\n    if (confirm("Are you sure you want to delete this master record?")) {\n      ', '').replace('\n    }\n  };', '')
    trans_content = trans_content.replace('if (activeTab === \'OpeningStock\') setOpeningStocks', del_logic + '\n      if (activeTab === \'OpeningStock\') setOpeningStocks')

# 6. Extract Tables
tables_match = re.search(r'(\{activeTab === \'Sections\' \? \(.*?\} \)\s*:\s*\(\s*<table.*?</table>\s*\)\})', master_content, re.DOTALL)
if tables_match:
    tables_logic = tables_match.group(1)
    trans_content = trans_content.replace('{activeTab === \'OpeningStock\' && (', tables_logic.replace('activeTab === \'Sections\' ? (', 'activeTab === \'Sections\' ? (\n').replace(': (\n                <table', ' : activeTab === \'Spares\' ? (\n                <table').replace('</table>\n              )}', '</table>\n              ) : null}\n\n              {activeTab === \'OpeningStock\' && (')

# 7. Extract Forms
forms_match = re.search(r'(\{activeTab === \'Sections\' \? \(.*?/\* ================== SPARES MASTER CREATION FORM ================== \*/.*?</>\s*\)\})', master_content, re.DOTALL)
if forms_match:
    forms_logic = forms_match.group(1)
    trans_content = trans_content.replace('{activeTab === \'OpeningStock\' && (', forms_logic.replace('activeTab === \'Sections\' ? (', 'activeTab === \'Sections\' ? (\n').replace(': (\n              /* ================== SPARES MASTER CREATION FORM ================== */', ' : activeTab === \'Spares\' ? (\n              /* ================== SPARES MASTER CREATION FORM ================== */').replace('</>\n            )}', '</>\n            ) : null}\n\n            {activeTab === \'OpeningStock\' && (')


with open('frontend/src/pages/spares/SparesTransaction.jsx', 'w') as f:
    f.write(trans_content)

print("Merged successfully!")
