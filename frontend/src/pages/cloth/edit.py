import re

with open("ClothInward.jsx", "r") as f:
    content = f.read()

start_marker = "        /* FORM ENTRY VIEW (RECREATES LAPTOP SCREEN) */"
end_marker = "        </div>\n      )}\n    </div>\n  );\n}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

old_form = content[start_idx:end_idx]

# I will extract the sections.
# General:
# <div style="display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px'"> ... </div>
# Remarks:
# <div className="form-group" style={{ marginTop: 12 }}>...</div>
# Process:
# <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>...</div>
# Items:
# <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>...</div>

new_form = """        /* FORM ENTRY VIEW */
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: 'General Spec & Headers' }, { id: 'process', label: 'Processing Steps' }, { id: 'items', label: 'Piece-wise Inward Grid' }].map(tab => (
              <button 
                type="button"
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {tab.id === 'general' ? <FileText size={16}/> : tab.id === 'process' ? <Settings size={16}/> : <Barcode size={16}/>}
                {tab.label}
              </button>
            ))}
          </div>

          <form id="inwardForm" onSubmit={handleSubmit} style={{ padding: 32 }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              {activeTab === 'general' && (
                <div className="animate-fade">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px' }}>
                    <div className="form-group">
                      <label>Inward Type *</label>
                      <select className="form-control" name="inward_type" value={formData.inward_type} onChange={handleHeaderChange} required>
                        <option>Vendor Inward</option>
                        <option>Purchase Inward</option>
                        <option>Grey Inward</option>
                        <option>Process Inward</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Inw ID (Ref) *</label>
                      <input className="form-control" name="ref_no" value={formData.ref_no} onChange={handleHeaderChange} required disabled />
                    </div>

                    <div className="form-group">
                      <label>Inw Date *</label>
                      <input type="date" className="form-control" name="inw_date" value={formData.inw_date} onChange={handleHeaderChange} required />
                    </div>

                    <div className="form-group">
                      <label>Vendor Order</label>
                      <select className="form-control" name="vendor_order" value={formData.vendor_order} onChange={handleHeaderChange}>
                        <option value="">-- Select Order --</option>
                        <option value="VO-001">VO-001 (Dinesh Mill)</option>
                        <option value="VO-002">VO-002 (Bala Weavers)</option>
                        <option value="VO-003">VO-003 (Saroja Textiles)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Vendor Name *</label>
                      <select className="form-control" name="party_name" value={formData.party_name} onChange={handleHeaderChange} required>
                        <option value="">-- Select Vendor --</option>
                        {options.all_parties.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Vendor DC No *</label>
                      <input className="form-control" name="dc_no" value={formData.dc_no} onChange={handleHeaderChange} required />
                    </div>

                    <div className="form-group">
                      <label>DC Date *</label>
                      <input type="date" className="form-control" name="dc_date" value={formData.dc_date} onChange={handleHeaderChange} required />
                    </div>

                    <div className="form-group">
                      <label>Vendor Order Mtr</label>
                      <input type="number" className="form-control" name="vendor_order_mtr" value={formData.vendor_order_mtr} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Order Mtr + 10% (Calculated)</label>
                      <input type="number" className="form-control" name="order_mtr_plus_10" value={formData.order_mtr_plus_10} readOnly style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                    </div>

                    <div className="form-group">
                      <label>Received Mtr (Calculated)</label>
                      <input type="number" className="form-control" name="received_mtr" value={formData.received_mtr} readOnly style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                    </div>

                    <div className="form-group">
                      <label>Balance Mtr (Calculated)</label>
                      <input type="number" className="form-control" name="balance_mtr" value={formData.balance_mtr} readOnly style={{ background: 'var(--bg-secondary)' }} />
                    </div>

                    <div className="form-group">
                      <label>IBPO No</label>
                      <select className="form-control" name="ibpo" value={formData.ibpo} onChange={handleHeaderChange}>
                        <option value="">-- Select IBPO --</option>
                        <option>IBPO-100</option>
                        <option>IBPO-200</option>
                        <option>IBPO-300</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Design No</label>
                      <select className="form-control" name="design_no" value={formData.design_no} onChange={handleHeaderChange}>
                        <option value="">-- Select Design --</option>
                        <option>D-2051</option>
                        <option>D-4902</option>
                        <option>D-9005</option>
                        <option>D-8891</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Const / Fabric Type</label>
                      <input className="form-control" name="const_fabric_type" value={formData.const_fabric_type} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Reed</label>
                      <input className="form-control" name="reed" value={formData.reed} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Pick</label>
                      <input className="form-control" name="pick" value={formData.pick} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Width</label>
                      <input className="form-control" name="width" value={formData.width} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Order Mtr</label>
                      <input type="number" className="form-control" name="order_mtr" value={formData.order_mtr} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Warp Mtr</label>
                      <input type="number" className="form-control" name="warp_mtr" value={formData.warp_mtr} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Inward Mtr (Calculated)</label>
                      <input type="number" className="form-control" name="inward_mtr" value={formData.inward_mtr} readOnly style={{ background: 'var(--bg-secondary)' }} />
                    </div>

                    <div className="form-group">
                      <label>Shed No</label>
                      <select className="form-control" name="shed_no" value={formData.shed_no} onChange={handleHeaderChange}>
                        <option>Shed A</option>
                        <option>Shed B</option>
                        <option>Shed C</option>
                        <option>Shed D</option>
                      </select>
                    </div>

                    {/* GREEN HIGHLIGHT BALANCE MTR FROM PHOTO */}
                    <div className="form-group">
                      <label>Balance Mtr (Order - Inward)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        readOnly 
                        value={(Number(formData.order_mtr) - Number(formData.total_meters)).toFixed(2)}
                        style={{ 
                          backgroundColor: '#10b981', 
                          color: '#ffffff', 
                          fontWeight: 700, 
                          border: 'none',
                          textAlign: 'center'
                        }} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Loom No</label>
                      <select className="form-control" name="loom_no" value={formData.loom_no} onChange={handleHeaderChange}>
                        <option>Loom 1</option>
                        <option>Loom 2</option>
                        <option>Loom 3</option>
                        <option>Loom 4</option>
                        <option>Loom 5</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Attn No</label>
                      <input className="form-control" name="attn_no" value={formData.attn_no} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Beam No</label>
                      <select className="form-control" name="beam_no" value={formData.beam_no} onChange={handleHeaderChange}>
                        <option value="">-- Select Beam --</option>
                        <option>BM-800</option>
                        <option>BM-801</option>
                        <option>BM-802</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Sizing (Szt) No</label>
                      <input className="form-control" name="szt_no" value={formData.szt_no} onChange={handleHeaderChange} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'process' && (
                <div className="animate-fade">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px' }}>
                    <div className="form-group">
                      <label>Process Type</label>
                      <select className="form-control" name="process_type" value={formData.process_type} onChange={handleHeaderChange}>
                        <option>Dyeing</option>
                        <option>Bleaching</option>
                        <option>Sanforizing</option>
                        <option>Finishing</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Inspection Type</label>
                      <select className="form-control" name="inspection_type" value={formData.inspection_type} onChange={handleHeaderChange}>
                        <option>Standard Check</option>
                        <option>Full Table Checking</option>
                        <option>AQL 2.5 Audit</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Inv Pin</label>
                      <input className="form-control" name="inv_pin" value={formData.inv_pin} onChange={handleHeaderChange} />
                    </div>
                    
                    <div className="form-group">
                      <label>Process Remarks</label>
                      <input className="form-control" name="process_remarks" value={formData.process_remarks} onChange={handleHeaderChange} />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: 'span 4' }}>
                      <label>General Remarks</label>
                      <textarea className="form-control" name="remarks" value={formData.remarks} onChange={handleHeaderChange} rows={2} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 16, fontWeight: 600 }}>
                      Piece-wise Inward Details
                    </h4>
                    {!isReadOnly && (
                      <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={handleAddItemRow}>
                        <Plus size={16} /> Add Piece
                      </button>
                    )}
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>S.No</th>
                          <th>Pcno *</th>
                          <th>Weight (kg)</th>
                          <th>VLoom</th>
                          <th>VPc No</th>
                          <th>Mtr *</th>
                          {!isReadOnly && <th style={{ width: 50 }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.length === 0 ? (
                          <tr>
                            <td colSpan={isReadOnly ? 6 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No cloth pieces added yet. Click "Add Piece" to insert piece specifications.
                            </td>
                          </tr>
                        ) : (
                          formData.items.map((item, index) => (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.piece_no}
                                  onChange={e => handleGridCellChange(index, 'piece_no', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.weight}
                                  onChange={e => handleGridCellChange(index, 'weight', Number(e.target.value))}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.vloom}
                                  onChange={e => handleGridCellChange(index, 'vloom', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.vpc_no}
                                  onChange={e => handleGridCellChange(index, 'vpc_no', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.meters}
                                  onChange={e => handleGridCellChange(index, 'meters', Number(e.target.value))}
                                  required
                                />
                              </td>
                              {!isReadOnly && (
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                                    onClick={() => handleRemoveItemRow(index)}
                                  >
                                    <Trash2 size={16} color="#ef4444" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* SUMMARY SECTION */}
                  <div style={{ marginTop: 24, padding: '16px 24px', background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Pieces</span>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{formData.total_pieces} Pcs</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Meters</span>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{formData.total_meters} Mtr</div>
                    </div>
                  </div>
                </div>
              )}

            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
}
"""

content = content[:start_idx] + new_form + content[end_idx:]

with open("ClothInward.jsx", "w") as f:
    f.write(content)

