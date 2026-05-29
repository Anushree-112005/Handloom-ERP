with open("GoodsRelease.jsx", "r") as f:
    content = f.read()

start_marker = "  if (view === 'form') {"
end_marker = "  // --- LIST / SPLIT VIEW ---"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

old_form = content[start_idx:end_idx]

group1_start = old_form.find('{/* Group 1: Goods Release Advice Headers */}')
group2_start = old_form.find('{/* Group 2: Party & Delivery Destinations */}')
group3_start = old_form.find('{/* Group 3: Despatch Detail (Grid Table) */}')
group4_start = old_form.find('{/* Group 4: Charges & Logistics Summary */}')
fieldset_end = old_form.find('            </fieldset>')

group1 = old_form[group1_start:group2_start].strip()
group2 = old_form[group2_start:group3_start].strip()

# Wait, group3 ends before group4. We need to include the "+ Add Item Row" button in group3.
# Let's just slice it from group3_start to group4_start.
group3 = old_form[group3_start:group4_start].strip()
group4 = old_form[group4_start:fieldset_end].strip()

# Remove bottom margins to fit in tab layout properly
group1 = group1.replace("marginBottom: 16", "margin: '0 0 16px 0'")
group2 = group2.replace("marginTop: 24, marginBottom: 16", "margin: '0 0 16px 0'")
group3 = group3.replace("marginTop: 24, marginBottom: 16", "margin: '0 0 16px 0'")
group4 = group4.replace("marginTop: 24, marginBottom: 16", "margin: '0 0 16px 0'")

new_form = f"""  if (view === 'form') {{
    return (
      <div className="animate-fade">
        <div className="card" style={{{{ padding: 0 }}}}>
          <div style={{{{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}}}>
            <h2 style={{{{ fontSize: 20, fontWeight: 700, margin: 0 }}}}>{{isReadOnly ? 'View GRA Details' : editingId ? 'Edit Goods Release Advice' : 'Add New Goods Release Advice'}}</h2>
            <div style={{{{ display: 'flex', gap: 12 }}}}>
              <button className="btn btn-secondary" onClick={{() => setView('list')}}><X size={{16}} /> Close</button>
              {{!isReadOnly && (
                <button type="submit" form="goodsReleaseForm" className="btn btn-primary"><Save size={{16}} /> {{editingId ? 'Update Advice' : 'Save Advice'}}</button>
              )}}
            </div>
          </div>

          <div style={{{{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}}}>
            {{[{{ id: 'general', label: '1. GRA Info' }}, {{ id: 'location', label: '2. Party & Destinations' }}, {{ id: 'items', label: '3. Despatch Grid' }}, {{ id: 'logistics', label: '4. Summary & Logistics' }}].map(tab => (
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
            <form id="goodsReleaseForm" onSubmit={{handleSubmit}}>
              <fieldset disabled={{isReadOnly}} style={{{{ border: 'none', padding: 0, margin: 0 }}}}>
                
                {{activeTab === 'general' && (
                  <div className="animate-fade">
{group1}
                  </div>
                )}}

                {{activeTab === 'location' && (
                  <div className="animate-fade">
{group2}
                  </div>
                )}}

                {{activeTab === 'items' && (
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
      </div>
    );
  }}

"""

content = content[:start_idx] + new_form + content[end_idx:]

with open("GoodsRelease.jsx", "w") as f:
    f.write(content)

