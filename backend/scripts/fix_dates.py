import re

filepath = "/home/cubeai/Desktop/Dinesh_Textile/frontend/src/pages/despatch/DespatchPlanning.jsx"
with open(filepath, "r") as f:
    content = f.read()

# Replace getFormattedDate
old_getFormattedDate = """const getFormattedDate = (d = new Date()) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};"""
new_getFormattedDate = """const getFormattedDate = (d = new Date()) => {
  return d.toISOString().split('T')[0];
};"""
content = content.replace(old_getFormattedDate, new_getFormattedDate)

# Replace formatForAPI
old_formatForAPI = """const formatForAPI = (dateStr) => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
};"""
new_formatForAPI = """const formatForAPI = (dateStr) => {
  return dateStr || null;
};"""
content = content.replace(old_formatForAPI, new_formatForAPI)

# Replace formatFromAPI
old_formatFromAPI = """const formatFromAPI = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return dateStr;
};"""
new_formatFromAPI = """const formatFromAPI = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};"""
content = content.replace(old_formatFromAPI, new_formatFromAPI)

# Update inputs to type="date"
date_fields = ["po_date", "date", "delivery_starting", "party_comp_date", "last_desp_date", "lc_tt_date", "comp_date", "planning_date"]

for field in date_fields:
    # Match <input ... name="field" ... />
    # We will use regex to find the input tag and inject or replace type
    pattern = r'(<input\s+)(?:type="[^"]*"\s+)?(className="form-control"\s+name="' + field + r'")'
    content = re.sub(pattern, r'\1type="date" \2', content)

# There's also date format parsing in filteredRecords:
old_filter_date = """    // Basic date checking
    if (r.date) {
      // Parse DD/MM/YYYY to date objects
      const parts = r.date.split('/');
      if (parts.length === 3) {
        const recordDate = new Date(parts[2], parts[1] - 1, parts[0]);"""
new_filter_date = """    // Basic date checking
    if (r.date) {
      const recordDate = new Date(r.date);"""
content = content.replace(old_filter_date, new_filter_date)

# Fix the closing brace issue for the filter date parsing if needed
# Actually, the old block was:
"""      // Parse DD/MM/YYYY to date objects
      const parts = r.date.split('/');
      if (parts.length === 3) {
        const recordDate = new Date(parts[2], parts[1] - 1, parts[0]);
        if (fromDate) matchesDate = matchesDate && recordDate >= new Date(fromDate);
        if (toDate) {
          const tDate = new Date(toDate);
          tDate.setHours(23, 59, 59);
          matchesDate = matchesDate && recordDate <= tDate;
        }
      }"""
# Let's do a direct replacement for the whole block
old_block = """      // Parse DD/MM/YYYY to date objects
      const parts = r.date.split('/');
      if (parts.length === 3) {
        const recordDate = new Date(parts[2], parts[1] - 1, parts[0]);
        if (fromDate) matchesDate = matchesDate && recordDate >= new Date(fromDate);
        if (toDate) {
          const tDate = new Date(toDate);
          tDate.setHours(23, 59, 59);
          matchesDate = matchesDate && recordDate <= tDate;
        }
      }"""
new_block = """      const recordDate = new Date(r.date);
      if (fromDate) matchesDate = matchesDate && recordDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && recordDate <= tDate;
      }"""
content = content.replace(old_block, new_block)

with open(filepath, "w") as f:
    f.write(content)
print("Updated DespatchPlanning.jsx")
