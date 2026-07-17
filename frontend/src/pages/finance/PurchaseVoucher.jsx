import React, { useState, useEffect } from 'react';
import { Receipt, Search, Plus, Filter, FileText } from 'lucide-react';
import { vouchersAPI } from '../../../services/financeApi';

export default function PurchaseVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      // Fetch both Purchase and Journal vouchers (since Job Work is usually Journal)
      const res = await vouchersAPI.list();
      const filtered = res.data.filter(v => v.voucher_type === 'Purchase' || v.voucher_type === 'Journal');
      setVouchers(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVouchers = vouchers.filter(v => 
    v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.narration && v.narration.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={20} color="var(--primary)" /> Purchase & Job Work Bills
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>View accounts payable generated from Inwards and Job Work POs.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search bills..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none' }}
            />
          </div>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Manual Bill Entry
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Voucher No</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Narration / Ref</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Amount</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading bills...</td></tr>
            ) : filteredVouchers.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No bills found.</td></tr>
            ) : (
              filteredVouchers.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>{v.voucher_number}</td>
                  <td style={{ padding: '12px 16px' }}>{v.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px' }}>{v.voucher_type}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{v.narration || v.reference_no}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                    ₹{(v.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600,
                      background: v.status === 'Draft' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                      color: v.status === 'Draft' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {v.status}
                    </span>
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
