import re

with open("ClothDelivery.jsx", "r") as f:
    content = f.read()

start_marker = "  if (view === 'form') {"
end_marker = "  // --- LIST / SPLIT VIEW ---"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

old_form = content[start_idx:end_idx]

# Split by the Groups
group1_start = old_form.find('{/* Group 1: General Delivery Info */}')
group2_start = old_form.find('{/* Group 2: Fabrication & Quality Details */}')
group3_start = old_form.find('{/* Group 3: Pieces Grid Details */}')
group4_start = old_form.find('{/* Group 4: Voucher & Accounting Section */}')
group5_start = old_form.find('{/* Group 5: Gate Pass & Logistics Section */}')
fieldset_end = old_form.find('            </fieldset>')

header_code = old_form[:old_form.find('<div className="card"')]

group1 = old_form[group1_start:group2_start]
group2 = old_form[group2_start:group3_start]
group3 = old_form[group3_start:group4_start]
group4 = old_form[group4_start:group5_start]
group5 = old_form[group5_start:fieldset_end]

# Clean up h4 margins to fit tabs
group1 = group1.replace('marginBottom: 16', 'margin: "0 0 16px 0"')
group2 = group2.replace('marginTop: 24, marginBottom: 16', 'margin: "0 0 16px 0"')
group3 = group3.replace('marginTop: 24, marginBottom: 16', 'margin: "0 0 16px 0"')
group4 = group4.replace('marginTop: 12, marginBottom: 16', 'margin: "0 0 16px 0"')
group5 = group5.replace('marginTop: 24, marginBottom: 16', 'margin: "0 0 16px 0"')


new_form = f"""  if (view === 'form') {{
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{{isReadOnly ? 'View Cloth Delivery Details' : editingId ? 'Edit Cloth Delivery Challan' : 'Add New Cloth Delivery Entry'}}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={{() => setView('list')}}><X size={{16}} /> Close</button>
              {{!isReadOnly && (
                <button type="submit" form="clothDeliveryForm" className="btn btn-primary"><Save size={{16}} /> {{editingId ? 'Update Challan' : 'Save Challan'}}</button>
              )}}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {{[{{ id: 'general', label: '1. General Info' }}, {{ id: 'specs', label: '2. Fabrication Specs' }}, {{ id: 'items', label: '3. Pieces Grid' }}, {{ id: 'logistics', label: '4. Vouchers & Logistics' }}].map(tab => (
              <button 
                type="button"
                key={{tab.id}} onClick={{() => setActiveTab(tab.id)}}
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {{tab.label}}
              </button>
            ))}}
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="clothDeliveryForm" onSubmit={{handleSubmit}}>
              <fieldset disabled={{isReadOnly}} style={{ border: 'none', padding: 0, margin: 0 }}>
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

                {{activeTab === 'logistics' && (
                  <div className="animate-fade">
{group4}
                    <br/>
{group5}
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

with open("ClothDelivery.jsx", "w") as f:
    f.write(content)

