import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, UploadCloud, RefreshCw } from 'lucide-react';
import { ledgersAPI } from '../../../services/financeApi';
import { partyAPI } from '../../../services/api';

export default function LedgerMaster() {
  const [ledgers, setLedgers] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ledgersRes, partiesRes] = await Promise.all([
        ledgersAPI.list(),
        partyAPI.list()
      ]);
      setLedgers(ledgersRes.data);
      setParties(partiesRes.data);
    } catch (err) {
      console.error("Failed to fetch ledgers/parties", err);
    } finally {
      setLoading(false);
    }
  };

  const syncPartiesToLedgers = async () => {
    try {
      // Create a ledger for any party that doesn't have one
      const existingLedgerNames = new Set(ledgers.map(l => l.name.toLowerCase()));
      const missingParties = parties.filter(p => !existingLedgerNames.has(p.party_name.toLowerCase()));
      
      let createdCount = 0;
      for (const party of missingParties) {
        const groupName = party.party_type === 'Buyer' ? 'Sundry Debtors' : 'Sundry Creditors';
        await ledgersAPI.create({
          name: party.party_name,
          group_name: groupName,
          company_id: 1, // Assume default company
          opening_balance: 0.0,
          opening_balance_type: party.party_type === 'Buyer' ? 'Dr' : 'Cr'
        });
        createdCount++;
      }
      if (createdCount > 0) {
        alert(`Successfully synced ${createdCount} new ledgers from Party Master.`);
        fetchData();
      } else {
        alert("All parties are already synced to ledgers!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync parties");
    }
  };

  const filteredLedgers = ledgers.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.group_name && l.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="var(--primary)" /> Ledger Master (Chart of Accounts)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage financial ledgers for all parties and accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search ledgers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none' }}
            />
          </div>
          <button className="btn btn-secondary" onClick={syncPartiesToLedgers} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} /> Sync from Party Master
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> New Ledger
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Ledger Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Group / Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Opening Balance</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Current Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledgers...</td></tr>
            ) : filteredLedgers.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No ledgers found. Try syncing from Party Master.</td></tr>
            ) : (
              filteredLedgers.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{l.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600,
                      background: l.group_name?.includes('Creditor') ? 'rgba(217, 119, 6, 0.1)' : 
                                  l.group_name?.includes('Debtor') ? 'rgba(5, 150, 105, 0.1)' : 'var(--bg-secondary)',
                      color: l.group_name?.includes('Creditor') ? 'var(--warning)' : 
                             l.group_name?.includes('Debtor') ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {l.group_name || 'Primary'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    ₹{(l.opening_balance || 0).toLocaleString()} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.opening_balance_type}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                     -
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
