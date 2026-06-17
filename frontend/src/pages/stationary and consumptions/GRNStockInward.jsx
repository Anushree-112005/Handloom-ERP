import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, FileText } from 'lucide-react';

export default function GRNStockInward() {
  const [view, setView] = useState('list');
  const [grns, setGrns] = useState([]);
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [selectedPoId, setSelectedPoId] = useState('');
  const [formData, setFormData] = useState({
    vendor: '', poId: '', invoiceNo: '', invoiceDate: '', items: []
  });

  useEffect(() => {
    setGrns(mockDb.get('consumables_grns'));
    setPOs(mockDb.get('consumables_pos'));
    setVendors(mockDb.get('consumables_vendors'));
    setItemsList(mockDb.get('consumables_items'));
  }, [view]);

  const handleLoadPO = (poId) => {
    setSelectedPoId(poId);
    const po = pos.find(p => p.id === poId);
    if (po) {
      setFormData({
        vendor: po.vendor,
        poId: po.id,
        invoiceNo: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: po.items.map(item => {
          const detail = itemsList.find(x => x.id === item.itemId);
          return {
            itemId: item.itemId,
            name: detail?.name || 'Item',
            orderedQty: item.qty,
            receivedQty: item.qty,
            acceptedQty: item.qty,
            rejectedQty: 0,
            rate: item.rate
          };
        })
      });
    }
  };

  const handleQtyChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = Number(value);
    if (field === 'receivedQty') {
      updated[index].acceptedQty = Number(value);
      updated[index].rejectedQty = 0;
    } else if (field === 'acceptedQty') {
      updated[index].rejectedQty = updated[index].receivedQty - Number(value);
    }
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('No items to inward.');
      return;
    }
    const newGrn = {
      id: 'GRN' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      vendor: formData.vendor,
      poId: formData.poId,
      invoiceNo: formData.invoiceNo,
      status: 'Accepted',
      items: formData.items
    };

    // Save GRN
    mockDb.add('consumables_grns', newGrn);

    // Update Stock Levels & post to Stock Ledger
    formData.items.forEach(item => {
      mockDb.postToLedger(item.itemId, 'GRN (Receipt)', newGrn.id, item.acceptedQty, 'IN');
    });

    // Update PO status to Completed
    if (formData.poId) {
      mockDb.update('consumables_pos', formData.poId, { status: 'Completed' });
    }

    alert('Stock Inwarded successfully! Stock levels updated.');
    setView('list');
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredGrns = grns.filter(g => 
    g.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.poId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: '#6366f1' }} /> Goods Receipt Note (GRN)
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Inward received supplies and update stock counts</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setFormData({ vendor: '', poId: '', invoiceNo: '', invoiceDate: '', items: [] });
            setSelectedPoId('');
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New Stock Inward
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All GRNs ({filteredGrns.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search GRNs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>GRN No</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>PO Reference</th>
                  <th>Invoice Number</th>
                  <th style={{ textAlign: "right" }}>Total Items</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrns.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredGrns.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{g.id}</td>
                    <td>{g.date}</td>
                    <td style={{ fontWeight: 600 }}>{g.vendor}</td>
                    <td style={{ fontFamily: "monospace", color: '#64748b' }}>{g.poId || '-'}</td>
                    <td>{g.invoiceNo || '-'}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {g.items.length} items
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        color: g.status === 'Accepted' ? '#047857' : '#1e40af', 
                        fontWeight: 600, 
                        backgroundColor: g.status === 'Accepted' ? '#d1fae5' : '#dbeafe', 
                        padding: '4px 10px', borderRadius: 12, fontSize: 12 
                      }}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: 10, background: '#6366f115', borderRadius: 10, color: '#6366f1' }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Goods Receipt Note Entry</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Log inward stock against an approved Purchase Order</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label>Select Pending PO</label>
                <select 
                  value={selectedPoId} 
                  onChange={(e) => handleLoadPO(e.target.value)} 
                  className="form-control"
                >
                  <option value="">-- Select PO --</option>
                  {pos.filter(po => po.status === 'Ordered').map(po => (
                    <option key={po.id} value={po.id}>{po.id} ({po.vendor})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Vendor <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" readOnly value={formData.vendor} className="form-control" style={{ background: '#f8fafc' }} />
              </div>
              <div className="form-group">
                <label>Invoice Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" required value={formData.invoiceNo} 
                  onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label>Invoice Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="date" required value={formData.invoiceDate} 
                  onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})} 
                  className="form-control" 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Items Received</h4>
              {formData.items.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  Please select a Pending PO to load items.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Name</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Ordered Qty</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Received Qty</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Accepted Qty</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Rejected Qty</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Rate (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: idx !== formData.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#6366f1', background: '#e0e7ff30' }}>{item.orderedQty}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <input 
                              type="number" required min="0" value={item.receivedQty} 
                              onChange={(e) => handleQtyChange(idx, 'receivedQty', e.target.value)} 
                              className="form-control" style={{ width: '90px', margin: '0 auto', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', background: '#dcfce730' }}>
                            <input 
                              type="number" required min="0" max={item.receivedQty} value={item.acceptedQty} 
                              onChange={(e) => handleQtyChange(idx, 'acceptedQty', e.target.value)} 
                              className="form-control" style={{ width: '90px', margin: '0 auto', textAlign: 'center', borderColor: '#86efac' }}
                            />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: '#ef4444', fontWeight: 600, background: '#fee2e230' }}>{item.rejectedQty}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>₹{item.rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Save GRN
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
