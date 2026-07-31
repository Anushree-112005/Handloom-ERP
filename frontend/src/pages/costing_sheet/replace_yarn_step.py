import re

file_path = r'c:\Users\Welcome\Desktop\Navani\dinesh_txt\frontend\src\pages\costing_sheet\CostingSheetModule.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "const renderYarnStep = () => {"
end_marker = "const renderWarpingStep = () => {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find renderYarnStep or renderWarpingStep.")
    exit(1)

new_render_yarn_step = """  const renderYarnStep = () => {
    const updateLine = (idx, field, val) => {
        setFormData(p => {
            const nLines = [...p.yarn_lines];
            nLines[idx][field] = val;
            const nd = {...p, yarn_lines: nLines};
            runCalculations(nd); return nd;
        });
    };
    
    const renderYarnGroup = (yarnType) => {
        const lines = formData.yarn_lines.map((yl, i) => ({...yl, globalIndex: i})).filter(yl => yl.yarn_type === yarnType);
        return (
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h5 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{yarnType}</h5>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => {
                        setFormData(p => {
                            const nd = {...p, yarn_lines: [...p.yarn_lines, { yarn_type: yarnType, color: '', percentage: yarnType === 'Weft' ? 100 : 100, ends_picks: 0, rate_kg: 0, wastage_pct: 0, ttl_kg: 0, cost_m: 0 }]};
                            runCalculations(nd); return nd;
                        });
                    }}><Plus size={14} style={{marginRight: 4}}/> Add Colour</button>
                </div>
                {lines.length > 0 ? (
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Yarn Template</th><th>Colour</th><th>%</th><th>Ends/Picks</th>
                                <th>Rate/KG</th><th>Wastage %</th><th>TTL KG</th><th>Cost/M</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((yl) => {
                                const idx = yl.globalIndex;
                                return (
                                    <tr key={idx}>
                                        <td>
                                            <select className="form-control" style={{padding: '4px 8px', height: 32, width: 140}} 
                                                onChange={e => {
                                                    const sel = yarnRates.find(y => y.id === parseInt(e.target.value));
                                                    if (sel) {
                                                        setFormData(p => {
                                                            const nLines = [...p.yarn_lines];
                                                            nLines[idx].color = sel.color;
                                                            nLines[idx].rate_kg = sel.rate_per_kg;
                                                            const nd = {...p, yarn_lines: nLines};
                                                            runCalculations(nd); return nd;
                                                        });
                                                    }
                                                }}>
                                                <option value="">Custom / Manual</option>
                                                {yarnRates.map(yr => (
                                                    <option key={yr.id} value={yr.id}>{yr.yarn_count} - {yr.color} ({yr.rate_per_kg}/kg)</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td><input type="text" className="form-control" style={{padding: '4px 8px', height: 32, width: 100}} value={yl.color} onChange={e=>updateLine(idx,'color',e.target.value)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 60}} value={yl.percentage} onChange={e=>updateLine(idx,'percentage',parseFloat(e.target.value)||0)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 80}} value={yl.ends_picks} onChange={e=>updateLine(idx,'ends_picks',parseFloat(e.target.value)||0)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 80}} value={yl.rate_kg} onChange={e=>updateLine(idx,'rate_kg',parseFloat(e.target.value)||0)}/></td>
                                        <td><input type="number" className="form-control" style={{padding: '4px 8px', height: 32, width: 80}} value={yl.wastage_pct} onChange={e=>updateLine(idx,'wastage_pct',parseFloat(e.target.value)||0)}/></td>
                                        <td>{(yl.ttl_kg||0).toFixed(2)}</td>
                                        <td>{(yl.cost_m||0).toFixed(2)}</td>
                                        <td><button className="btn btn-secondary" style={{padding: '4px 8px'}} onClick={() => {
                                            setFormData(p => { const nd = {...p, yarn_lines: p.yarn_lines.filter((_,i)=>i!==idx)}; runCalculations(nd); return nd; });
                                        }}><Trash2 size={14}/></button></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 14 }}>No colours added. Click "+ Add Colour" to specify yarn blend.</div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-fade">
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn & Colours</h4>
            {renderYarnGroup('Warp 1')}
            {renderYarnGroup('Warp 2')}
            {renderYarnGroup('Weft')}
        </div>
    );
  };

  """

content = content[:start_idx] + new_render_yarn_step + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced renderYarnStep!")
