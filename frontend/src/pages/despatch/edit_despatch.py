with open("DespatchPlanning.jsx", "r") as f:
    content = f.read()

start_marker = "/* INPUT FORM COMPONENT - ACCORDING TO CLIENT PICTURE */"
end_marker = "      )}\n    </div>\n  );\n}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

old_form = content[start_idx:end_idx]

group1_start = old_form.find('{/* SECTION 1: GREEN TOP BAR SECTION */}')
group2_start = old_form.find('{/* SECTION 2: THREE COLUMN GRID SECTION */}')
group3_start = old_form.find('{/* SECTION 3: YELLOW ACCENT BAR */}')
group4_start = old_form.find('{/* SECTION 4: BLUE ACCENT BAR */}')
buttons_start = old_form.find('{/* LOWER ROW: FORM BUTTONS */}')

group1 = old_form[group1_start:group2_start].strip()
group2 = old_form[group2_start:group3_start].strip()
group3 = old_form[group3_start:group4_start].strip()
group4 = old_form[group4_start:buttons_start].strip()
buttons = old_form[buttons_start:].strip()

# We need to drop the buttons part from the original form, but they are included until `</form>`. Let's just slice until `</fieldset>`
fieldset_end = buttons.find('            </fieldset>')
buttons = buttons[:fieldset_end].strip()

# Adjust margins
group1 = group1.replace("marginBottom: 24", "margin: '0 0 16px 0'")
group2 = group2.replace("marginBottom: 24", "margin: '0 0 16px 0'")
group3 = group3.replace("marginBottom: 24", "margin: '0 0 16px 0'")
group4 = group4.replace("marginBottom: 32", "margin: '0 0 16px 0'")

new_form = f"""/* INPUT FORM COMPONENT - ACCORDING TO CLIENT PICTURE */
        <div className="card" style={{{{ padding: 0 }}}}>
          <div style={{{{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}}}>
            <h2 style={{{{ fontSize: 20, fontWeight: 700, margin: 0 }}}}>{{isReadOnly ? 'View Despatch Plan' : editingId ? 'Edit Despatch Plan' : 'New Despatch Plan'}}</h2>
            <div style={{{{ display: 'flex', gap: 12 }}}}>
              <button className="btn btn-secondary" onClick={{() => setView('list')}}><X size={{16}} /> Close</button>
              {{!isReadOnly && (
                <button type="submit" form="despatchForm" className="btn btn-primary"><Save size={{16}} /> {{editingId ? 'Update Plan' : 'Save Plan'}}</button>
              )}}
            </div>
          </div>

          <div style={{{{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}}}>
            {{[{{ id: 'general', label: '1. Basic Details' }}, {{ id: 'planning', label: '2. Planning & Delivery' }}, {{ id: 'order', label: '3. Order Info' }}, {{ id: 'logistics', label: '4. Logistics & Stock' }}].map(tab => (
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
            <form id="despatchForm" onSubmit={{handleSubmit}}>
              <fieldset disabled={{isReadOnly}} style={{{{ border: 'none', padding: 0, margin: 0 }}}}>
                
                {{activeTab === 'general' && (
                  <div className="animate-fade">
{group1}
                  </div>
                )}}

                {{activeTab === 'planning' && (
                  <div className="animate-fade">
{group2}
                  </div>
                )}}

                {{activeTab === 'order' && (
                  <div className="animate-fade">
{group3}
                  </div>
                )}}

                {{activeTab === 'logistics' && (
                  <div className="animate-fade">
{group4}
                  </div>
                )}}
              </fieldset>
            </form>
          </div>
        </div>
"""

content = content[:start_idx] + new_form + "\n" + content[end_idx:]

with open("DespatchPlanning.jsx", "w") as f:
    f.write(content)
