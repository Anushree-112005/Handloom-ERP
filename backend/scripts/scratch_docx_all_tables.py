import docx

doc = docx.Document("/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/WEAVING_YARN_CALCULATION_GUIDE.docx")

for idx, table in enumerate(doc.tables):
    print(f"\n--- Table {idx} ---")
    for r_idx, row in enumerate(table.rows[:3]): # print up to 3 rows
        print(f"R{r_idx}: {[c.text.strip().replace(chr(10), ' ') for c in row.cells]}")
