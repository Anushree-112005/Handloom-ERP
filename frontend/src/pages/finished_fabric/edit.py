with open("FinishedFabricInward.jsx", "r") as f:
    content = f.read()

start_marker = "  if (view === 'form') {"
end_marker = "  // --- LIST / SPLIT VIEW ---"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

old_form = content[start_idx:end_idx]

# Extract the inner groups
group1_start = old_form.find('{/* Section 1: Inward Reference details */}')
group2_start = old_form.find('{/* Left Side: Technical detail form columns */}')
group3_start = old_form.find('{/* Right Side: Pieces detail grid table */}')
fieldset_end = old_form.find('            </fieldset>')

group1 = old_form[group1_start:old_form.find('{/* Split layout', group1_start)]
group2 = old_form[group2_start:group3_start]
group3 = old_form[group3_start:fieldset_end]

# Clean up div closures and margins if any
group2 = group2.strip()
if group2.endswith('</div>'):
    group2 = group2[:-6].strip()

group3 = group3.strip()
if group3.endswith('</div>'):
    group3 = group3[:-6].strip()

new_form = f"""  if (view === 'form') {{
    return (
      <div className="animate-fade">
        <div className="card" style={{{{ padding: 0 }}}}>
          <div style={{{{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}}}>
            <h2 style={{{{ fontSize: 20, fontWeight: 700, margin: 0 }}}}>{{isReadOnly ? 'View Fabric Inward Entry' : editingId ? 'Edit Fabric Inward Entry' : 'Add Finished Fabric Inward Entry'}}</h2>
            <div style={{{{ display: 'flex', gap: 12 }}}}>
              <button className="btn btn-secondary" onClick={{() => setView('list')}}><X size={{16}} /> Close</button>
              {{!isReadOnly && (
                <button type="submit" form="fabricInwardForm" className="btn btn-primary"><Save size={{16}} /> {{editingId ? 'Update Inward' : 'Save Inward'}}</button>
              )}}
            </div>
          </div>

          <div style={{{{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}}}>
            {{[{{ id: 'general', label: '1. Inward Reference Info' }}, {{ id: 'specs', label: '2. Fabric Specs & Metrics' }}, {{ id: 'items', label: '3. Despatch Grid Details' }}].map(tab => (
              <button 
                type="button"
                key={{tab.id}} onClick={{() => setActiveTab(tab.id)}}
                style={{{{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8
                }}}}
              >
                {{tab.label}}
              </button>
            ))}}
          </div>

          <div style={{{{ padding: 32, background: '#fff' }}}}>
            <form id="fabricInwardForm" onSubmit={{handleSubmit}}>
              <fieldset disabled={{isReadOnly}} style={{{{ border: 'none', padding: 0, margin: 0 }}}}>
                
                {{activeTab === 'general' && (
                  <div className="animate-fade">
{group1}
                  </div>
                )}}

                {{activeTab === 'specs' && (
                  <div className="animate-fade">
{group2}
                  </div>
                )}}

                {{activeTab === 'items' && (
                  <div className="animate-fade">
{group3}
                  </div>
                )}}

              </fieldset>
            </form>
          </div>
        </div>
      </div>
    );
  }}

"""

content = content[:start_idx] + new_form + content[end_idx:]

with open("FinishedFabricInward.jsx", "w") as f:
    f.write(content)

