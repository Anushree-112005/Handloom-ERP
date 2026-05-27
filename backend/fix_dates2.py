import re

filepath = "/home/cubeai/Desktop/Dinesh_Textile/frontend/src/pages/despatch/DespatchPlanning.jsx"
with open(filepath, "r") as f:
    content = f.read()

# Fix the broken ibpo_rate replacement from earlier
content = content.replace(
    '<input type="date" className="form-control" name="lc_tt_date" value={formData.lc_tt_date} onChange={handleChange} />',
    '<input className="form-control" name="ibpo_rate" value={formData.ibpo_rate} onChange={handleChange} />'
)

# Fix the date inputs by literally string matching
replacements = {
    '<input className="form-control" name="delivery_starting"': '<input type="date" className="form-control" name="delivery_starting"',
    '<input className="form-control" name="party_comp_date"': '<input type="date" className="form-control" name="party_comp_date"',
    '<input className="form-control" name="last_desp_date"': '<input type="date" className="form-control" name="last_desp_date"',
    '<input className="form-control" name="lc_tt_date"': '<input type="date" className="form-control" name="lc_tt_date"',
    '<input className="form-control" name="comp_date"': '<input type="date" className="form-control" name="comp_date"',
    '<input className="form-control" name="planning_date"': '<input type="date" className="form-control" name="planning_date"'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(filepath, "w") as f:
    f.write(content)
print("Updated DespatchPlanning.jsx fixed dates")
