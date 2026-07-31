import os
path_dc = 'src/pages/stationary and consumptions/ReturnableDCManagement.jsx'
with open(path_dc, 'r', encoding='utf-8') as f:
    c = f.read()

# Fix DC syntax
# The original has:
#   )
# }
#     </div >
#   );
# }
c = c.replace('  )\n}\n    </div >\n  );\n}', '  );\n}')

with open(path_dc, 'w', encoding='utf-8') as f:
    f.write(c)

path_rep = 'src/pages/stationary and consumptions/reports/PurchaseReceivedReport.jsx'
with open(path_rep, 'r', encoding='utf-8') as f:
    r = f.read()

# Fix duplicate border key
r = r.replace("border: 'none', ", "")

with open(path_rep, 'w', encoding='utf-8') as f:
    f.write(r)
