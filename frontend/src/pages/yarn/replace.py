import sys

with open('/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src/pages/yarn/DyedYarnDelivery.jsx', 'r') as f:
    content = f.read()

start_marker = '      ) : (\n        <div className="card" style={{ padding: 0 }}>'
end_marker = '        </div>\n      )}\n\n      <A4DocumentPreview'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    new_form = """      ) : (
        <div className="card" style={{ padding: 0, background: '#f8fafc', border: 'none' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border)', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Send size={20} color="var(--primary)" /> {isReadOnly ? 'View Delivery Details' : editingId ? 'Edit Delivery' : 'New Dyed Yarn Delivery'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button type="submit" form="delivery-form" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}</button>
              )}
            </div>
          </div>

          <form id="delivery-form" onSubmit={handleCreate} style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
            {/* MAIN CONTENT COLUMN */}
            <fieldset disabled={isReadOnly} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0, border: 'none', padding: 0, margin: 0 }}>
              
              {/* Delivery Info */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>DELIVERY INFO</span>
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    <div className="form-group"><label>DC No</label><input className="form-control" name="dc_no" value={form.dc_no} onChange={handleChange} disabled={editingId != null} /></div>
                    <div className="form-group"><label>DC No (Alt)</label><input className="form-control" name="dc_no_alt" value={form.dc_no_alt} onChange={handleChange} /></div>
                    <div className="form-group"><label>DC Date</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Add Date</label><input type="date" className="form-control" name="add_date" value={form.add_date} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Delivery Type</label>
                      <select className="form-control" name="delivery_type" value={form.delivery_type} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Delivery Mode</label>
                      {isCustomDeliveryMode ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" placeholder="New Mode" value={customDeliveryModeVal} onChange={e => setCustomDeliveryModeVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomDeliveryMode} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomDeliveryMode(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="delivery_mode" value={form.delivery_mode || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          {options.masters?.transport_mode_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="">Select Party...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Delivery Address</label><input className="form-control" name="delivery_address" value={form.delivery_address} onChange={handleChange} /></div>
                    <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Order No</label>
                      <select className="form-control" name="order_no" value={form.order_no} onChange={(e) => handleFetchFromBuyerOrder(e.target.value)}>
                        <option value="">Select Order...</option>
                        {buyerOrders.map(o => <option key={o.id} value={o.order_no}>{o.order_no} - {o.party_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>From Dyed Receipt</label>
                      <select className="form-control" name="ref_receipt_inv" value={form.ref_receipt_inv || ''} onChange={(e) => handleFetchFromReceipt(e.target.value)}>
                        <option value="">Select Receipt...</option>
                        {receipts.map(r => <option key={r.id} value={r.inv_no}>{r.inv_no} - {r.party_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Design Type</label><input className="form-control" name="design_type" value={form.design_type} onChange={handleChange} /></div>
                  </div>
                </div>
              </div>

              {/* Items Block */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>YARN DETAILS</span>
                  {!isReadOnly && <button type="button" className="btn btn-secondary" onClick={addItem} style={{ padding: '4px 12px', fontSize: 12 }}><Plus size={14} /> Add Row</button>}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>S.No</th><th>Yarn Type</th><th>Count</th><th>Colour</th><th>Shade No</th><th>Lot No</th><th>Batch No</th>
                          <th>Bag</th><th>Cones</th><th>Net Wt (Kgs)</th><th>Rate</th><th>Amount</th><th>Remarks</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              {customYarnTypeIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 120, padding: '4px 6px' }} placeholder="New Yarn" value={customYarnTypeVal} onChange={e => setCustomYarnTypeVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomYarnType} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setCustomYarnTypeIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 100, padding: '4px 6px' }} value={item.yarn_type || ''} onChange={e => updateItem(idx, 'yarn_type', e.target.value)}>
                                  <option value="">Select...</option>
                                  {options.masters?.yarn_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Custom</option>
                                </select>
                              )}
                            </td>
                            <td><input className="form-control" style={{ width: 60, padding: '4px 6px' }} value={item.count} onChange={e => updateItem(idx, 'count', e.target.value)} /></td>
                            <td>
                              {customColourIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 90, padding: '4px 6px' }} placeholder="New Colour" value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomColour} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setCustomColourIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 80, padding: '4px 6px' }} value={item.color || ''} onChange={e => updateItem(idx, 'color', e.target.value)}>
                                  <option value="">Select...</option>
                                  {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Custom</option>
                                </select>
                              )}
                            </td>
                            <td><input className="form-control" style={{ width: 70, padding: '4px 6px' }} value={item.shade_no} onChange={e => updateItem(idx, 'shade_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 70, padding: '4px 6px' }} value={item.lot_no} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 70, padding: '4px 6px' }} value={item.batch_no} onChange={e => updateItem(idx, 'batch_no', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 50, padding: '4px 6px' }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 50, padding: '4px 6px' }} value={item.cones} onChange={e => updateItem(idx, 'cones', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '4px 6px' }} value={item.total_kgs} onChange={e => updateItem(idx, 'total_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '4px 6px' }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '4px 6px' }} value={item.amount} readOnly /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '4px 6px' }} value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>

              {/* Logistics & Other Details */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>LOGISTICS & ADDITIONAL DETAILS</span>
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    <div className="form-group"><label>Transport</label>
                      {isCustomTransport ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" placeholder="New Transport" value={customTransportVal} onChange={e => setCustomTransportVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomTransport} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomTransport(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="transport" value={form.transport || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          {options.masters?.transport_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Certificate Type</label>
                      {isCustomCertificateType ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" placeholder="New Certificate Type" value={customCertificateTypeVal} onChange={e => setCustomCertificateTypeVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomCertificateType} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomCertificateType(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="certificate_type" value={form.certificate_type || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          {options.masters?.certified_type?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Driver Name</label><input className="form-control" name="driver_name" value={form.driver_name} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Time</label><input type="time" className="form-control" name="delivery_time" value={form.delivery_time} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Vehicle No</label><input className="form-control" name="vehicle_no" value={form.vehicle_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>LR No / Consignment No</label><input className="form-control" name="lr_no" value={form.lr_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Challan Type</label>
                      <select className="form-control" name="delivery_challan_type" value={form.delivery_challan_type} onChange={handleChange}>
                        <option value="">Select...</option>
                        <option>Internal</option>
                        <option>Customer</option>
                        <option>Return</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Customer PO No</label><input className="form-control" name="customer_po_no" value={form.customer_po_no} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Dyeing Batch No</label><input className="form-control" name="dyeing_batch_no" value={form.dyeing_batch_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Dispatch From</label><input className="form-control" name="dispatch_from" value={form.dispatch_from} onChange={handleChange} /></div>
                    <div className="form-group"><label>Received By</label><input className="form-control" name="received_by" value={form.received_by} onChange={handleChange} /></div>
                    <div className="form-group"><label>Mobile No</label><input className="form-control" name="mobile_no" value={form.mobile_no} onChange={handleChange} /></div>

                    <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                  </div>
                </div>
              </div>

            </fieldset>

            {/* STICKY SUMMARY COLUMN */}
            <div style={{ flex: '0 0 320px', position: 'sticky', top: 24 }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>DELIVERY SUMMARY</span>
                </div>
                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Delv Kgs</span>
                    <input type="number" className="form-control" name="total_delv_kgs" value={form.total_delv_kgs} onChange={handleChange} style={{ width: 80, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Rin Kgs</span>
                    <input type="number" className="form-control" name="total_rin_kgs" value={form.total_rin_kgs} onChange={handleChange} style={{ width: 80, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Balance Kgs</span>
                    <input type="number" className="form-control" name="balance_kgs" value={form.balance_kgs} onChange={handleChange} style={{ width: 80, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>

                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px dashed var(--border)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Gross Amount</span>
                    <input type="number" className="form-control" name="gross_amount" value={form.gross_amount} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Cost</span>
                    <input type="number" className="form-control" name="cost" value={form.cost} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Chg</span>
                    <input type="number" className="form-control" name="freight_charges" value={form.freight_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading Chg</span>
                    <input type="number" className="form-control" name="loading_charges" value={form.loading_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance</span>
                    <input type="number" className="form-control" name="insurance" value={form.insurance} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Other Chg</span>
                    <input type="number" className="form-control" name="other_charges" value={form.other_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Discount</span>
                    <input type="number" className="form-control" name="discount" value={form.discount} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Tax Value</span>
                    <input type="number" className="form-control" name="tax_value" value={form.tax_value} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST</span>
                    <input type="number" className="form-control" name="sgst" value={form.sgst} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST</span>
                    <input type="number" className="form-control" name="igst" value={form.igst} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total GST</span>
                    <input type="number" className="form-control" name="total_gst" value={form.total_gst} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>

                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px dashed var(--border)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>TCS</span>
                    <input type="number" className="form-control" name="tcs" value={form.tcs} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>TDS</span>
                    <input type="number" className="form-control" name="tds" value={form.tds} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Advance</span>
                    <input type="number" className="form-control" name="advance_received" value={form.advance_received} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Round Off</span>
                    <input type="number" className="form-control" name="round_off" value={form.round_off} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>GRAND TOTAL</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                      INR {parseFloat(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>BALANCE</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)' }}>
                      INR {parseFloat(form.balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </form>
        </div>
      )}
"""
    
    new_content = content[:start_idx] + new_form + content[end_idx + len(end_marker):]
    
    with open('/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src/pages/yarn/DyedYarnDelivery.jsx', 'w') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print("Could not find markers.")
