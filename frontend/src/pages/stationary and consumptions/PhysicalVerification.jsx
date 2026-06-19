import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Save, Clipboard } from 'lucide-react';

export default function PhysicalVerification() {
  const [items, setItems] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [auditor, setAuditor] = useState('');
  const [actualQtys, setActualQtys] = useState({});

  useEffect(() => {
    const list = mockDb.get('consumables_items');
    setItems(list);
    setVerifications(mockDb.get('consumables_verifications') || []);
    
    // Initialize actual qtys map
    const initial = {};
    list.forEach(i => {
      initial[i.id] = i.currentStock || 0;
    });
    setActualQtys(initial);
  }, []);

  const handleQtyChange = (itemId, val) => {
    setActualQtys({
      ...actualQtys,
      [itemId]: Number(val)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const verId = 'VER' + Math.floor(Math.random() * 10000);
    const dateStr = new Date().toISOString().split('T')[0];

    const records = items.map(itm => {
      const system = itm.currentStock || 0;
      const actual = actualQtys[itm.id];
      const diff = actual - system;

      // If there's a difference, post to ledger to adjust
      if (diff !== 0) {
        const type = diff > 0 ? 'IN' : 'OUT';
        mockDb.postToLedger(itm.id, 'Physical Audit Adj', verId, Math.abs(diff), type);
      }

      return {
        itemId: itm.id,
        name: itm.name,
        systemQty: system,
        actualQty: actual,
        difference: diff
      };
    });

    const newVerificationObj = {
      id: verId,
      date: dateStr,
      auditor: auditor || 'Internal Auditor',
      items: records
    };

    const currentVerifications = mockDb.get('consumables_verifications') || [];
    currentVerifications.push(newVerificationObj);
    mockDb.set('consumables_verifications', currentVerifications);

    alert('Physical Stock verification completed! Discrepancies updated in stock ledger.');
    
    // Reload items stock
    setItems(mockDb.get('consumables_items'));
    setVerifications(currentVerifications);
    setAuditor('');
  };

  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVerifications = verifications.filter(v => 
    v.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.auditor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clipboard style={{ color: '#6366f1' }} /> Physical Stock Verification
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Audit stock count, match physical inventories, and auto-correct ledger differences</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setAuditor('');
            // Reset actual quantities to current system quantities
            const initial = {};
            items.forEach(i => {
              initial[i.id] = i.currentStock || 0;
            });
            setActualQtys(initial);
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clipboard size={16} /> New Verification
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Verifications ({filteredVerifications.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search verifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Verification ID</th>
                  <th>Date</th>
                  <th>Auditor</th>
                  <th style={{ textAlign: 'center' }}>Total Items Audited</th>
                  <th style={{ textAlign: 'center' }}>Discrepancies</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No past verifications found</td></tr>
                ) : filteredVerifications.map(v => {
                  const discrepancies = v.items.filter(i => i.difference !== 0).length;
                  return (
                    <tr key={v.id}>
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{v.id}</td>
                      <td>{v.date}</td>
                      <td style={{ fontWeight: 600 }}>{v.auditor}</td>
                      <td style={{ textAlign: 'center' }}>{v.items.length}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: discrepancies > 0 ? '#ef4444' : '#10b981' }}>
                        {discrepancies > 0 ? `${discrepancies} Mismatches` : '100% Match'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          Completed
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Verification Process Sheet</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Log actual physical quantities to auto-generate adjustments</p>
            </div>
            <div style={{ width: 300 }}>
              <input 
                type="text" required value={auditor} 
                onChange={(e) => setAuditor(e.target.value)} 
                placeholder="Auditor / Verifier Name *" 
                className="form-control" 
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Code</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Name</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>System Qty</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Actual Qty</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((itm, idx) => {
                    const system = itm.currentStock || 0;
                    const actual = actualQtys[itm.id] !== undefined ? actualQtys[itm.id] : system;
                    const diff = actual - system;
                    return (
                      <tr key={itm.id} style={{ borderBottom: idx !== items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{itm.code || itm.id}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{itm.name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#6366f1', background: '#e0e7ff30' }}>{system}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input 
                            type="number" required min="0" value={actual} 
                            onChange={(e) => handleQtyChange(itm.id, e.target.value)} 
                            className="form-control" style={{ width: '90px', margin: '0 auto', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: diff < 0 ? '#ef4444' : diff > 0 ? '#10b981' : '#94a3b8' }}>
                          {diff > 0 ? '+' : ''}{diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Post Verification Audit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
