with open("OnTableChecking.jsx", "r") as f:
    content = f.read()

start_marker = "        /* CREATE / EDIT FORM VIEW */"
end_marker = "      )}\n    </div>\n  );\n}\n"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

old_form = content[start_idx:end_idx]

# Extract groups
group1_start = old_form.find('{/* SECTION 1: HEADER GENERAL INFO */}')
group2_start = old_form.find('{/* SECTION 2: GRID ITEMS TABLE */}')
fieldset_end = old_form.find('            </fieldset>')

group1 = old_form[group1_start:group2_start]
group2 = old_form[group2_start:fieldset_end]

# Clean up any trailing space
group1 = group1.strip()
group2 = group2.strip()

# Clean up h4 margins to fit tabs
group1 = group1.replace("marginBottom: 16", "margin: '0 0 16px 0'")
group2 = group2.replace("marginTop: 24, marginBottom: 16", "margin: '0 0 16px 0'")

new_form = f"""        /* CREATE / EDIT FORM VIEW */
        <div className="card" style={{{{ padding: 0 }}}}>
          <div style={{{{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}}}>
            {{[{{ id: 'general', label: '1. General Info & Barcode' }}, {{ id: 'items', label: '2. Inspection Grid' }}].map(tab => (
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
            <form id="checkingForm" onSubmit={{handleSubmit}}>
              <fieldset disabled={{isReadOnly}} style={{{{ border: 'none', padding: 0, margin: 0 }}}}>
                
                {{activeTab === 'general' && (
                  <div className="animate-fade">
{group1}
                  </div>
                )}}

                {{activeTab === 'items' && (
                  <div className="animate-fade">
{group2}
                  </div>
                )}}

              </fieldset>
            </form>
          </div>
        </div>"""

content = content[:start_idx] + new_form + content[end_idx:]

with open("OnTableChecking.jsx", "w") as f:
    f.write(content)

