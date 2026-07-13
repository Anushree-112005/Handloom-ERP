import docx

doc = docx.Document("/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/WEAVING_YARN_CALCULATION_GUIDE.docx")

table = doc.tables[5]
for idx, row in enumerate(table.rows):
    print(f"R{idx}: {[cell.text.strip().replace(chr(10), ' ') for cell in row.cells]}")
