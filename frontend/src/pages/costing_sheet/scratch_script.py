import re

file_path = r'c:\Users\Welcome\Desktop\Navani\dinesh_txt\frontend\src\pages\costing_sheet\CostingSheetModule.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace input-field with form-control
content = content.replace('className="input-field"', 'className="form-control"')

# Replace h3 step headers with h4 party master headers
content = re.sub(r'<h3 style={{ marginBottom: 24 }}>(.*?)</h3>', r'<h4 style={{ color: \'var(--primary)\', margin: \'0 0 16px 0\', borderBottom: \'1px solid var(--border)\', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>\1</h4>', content)

wizard_start = content.find('<div style={{ display: \'flex\', gap: 24, alignItems: \'flex-start\' }}>')
wizard_end_str = '{/* Right Sticky Summary */}'
wizard_end = content.find(wizard_end_str, wizard_start)

if wizard_start != -1 and wizard_end != -1:
    wizard_full_end = content.find('</div>', wizard_end) + 6
    wizard_layout = content[wizard_start:wizard_full_end]
    
    party_master_layout = '''<div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {STEPS.map(tab => (
              <button
                key={tab.id} onClick={(e) => { e.preventDefault(); setCurrentStep(tab.id); }}
                type="button"
                style={{
                  padding: '16px 24px', background: currentStep === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: currentStep === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: currentStep === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
             {renderActiveStep()}
             
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
                 <button type="button" className="btn btn-secondary" 
                     disabled={STEPS.findIndex(s => s.id === currentStep) === 0}
                     onClick={() => setCurrentStep(STEPS[STEPS.findIndex(s => s.id === currentStep) - 1].id)}>
                     Previous Section
                 </button>
                 <button type="button" className="btn btn-primary" 
                     disabled={STEPS.findIndex(s => s.id === currentStep) === STEPS.length - 1}
                     onClick={() => setCurrentStep(STEPS[STEPS.findIndex(s => s.id === currentStep) + 1].id)}>
                     Next Section
                 </button>
             </div>
          </div>
        </div>'''
        
    content = content.replace(wizard_layout, party_master_layout)
    
    # Grid replacements for form rows to match Party Master
    content = content.replace("display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24", "display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24")
    content = content.replace("display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16", "display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
