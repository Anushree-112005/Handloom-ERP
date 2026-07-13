import os
import re

files_to_fix = [
    "frontend/src/pages/purchase_orders/TwistingDoublingPO.jsx",
    "frontend/src/pages/purchase_orders/YarnDyeingPO.jsx",
    "frontend/src/pages/purchase_orders/FabricDyeingPO.jsx",
    "frontend/src/pages/purchase_orders/WarpingSizingPO.jsx",
    "frontend/src/pages/purchase_orders/WeavingPO.jsx",
    "frontend/src/pages/purchase_orders/ProcessingPO.jsx",
    "frontend/src/pages/purchase_orders/ClothPurchasePO.jsx",
]

state_line = "  const [editingTermIdx, setEditingTermIdx] = useState(null);\n  const [editingTermVal, setEditingTermVal] = useState('');\n"

new_terms_block = """                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(form.terms_conditions || []).map((term, idx) => (
                          <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {editingTermIdx === idx ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13, border: '1px solid var(--primary)' }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}} />
                                <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={14} /></button>
                                <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingTermIdx(null)}><X size={14} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span>{term}</span>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm({ ...form, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) })} title="Delete"><Trash2 size={13} /></button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>"""

old_terms_regex = re.compile(r'\{\(form\.terms_conditions\s*\|\|\s*\[\]\)\.map\(\(term,\s*idx\)\s*=>\s*\(\s*<div\s*key=\{idx\}\s*style=\{\{.*?prompt\(\'Edit term:\',\s*term\);.*?</button>\s*</div>\s*</div>\s*\)\)\}', re.DOTALL)

for fpath in files_to_fix:
    with open(fpath, 'r') as f:
        content = f.read()

    # Inject state variables if not present
    if "const [editingTermIdx" not in content:
        # Find where other states are declared (e.g. const [newTerm, setNewTerm])
        content = content.replace("const [newTerm, setNewTerm] = useState('');", 
                                  "const [newTerm, setNewTerm] = useState('');\n" + state_line)

    # Replace the old mapping block with the new one
    content = old_terms_regex.sub(new_terms_block, content)

    with open(fpath, 'w') as f:
        f.write(content)

print("Terms and conditions inline edit updated for all files.")
