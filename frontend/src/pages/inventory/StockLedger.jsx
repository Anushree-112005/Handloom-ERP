import { useState, useMemo, useEffect } from 'react';
import { FileText, Search, Download, ArrowUpRight, ArrowDownLeft, Filter, Calendar, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import api, { erpStockAPI } from '../../services/api';

export default function StockLedger() {
  const [searchTerm, setSearchTerm] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('All Transactions');
  const [ledgerData, setLedgerData] = useState([]);

  useEffect(() => {
    const fetchLedgerData = async () => {
      try {
        let mapped = [];
        try {
          const res = await inventoryAPI.getStockLedger();
          if (res.data && res.data.length > 0) {
            mapped = res.data.map(mov => ({
              id: mov.id,
              date: mov.txn_date ? new Date(mov.txn_date).toLocaleDateString() : new Date().toLocaleDateString(),
              sku: mov.item_name || 'Yarn Item',
              type: mov.movement_type === 'INWARD' ? 'Inward' : 'Outward',
              ref: mov.ref_voucher_no || mov.lot_no || '-',
              qtyIn: mov.movement_type === 'INWARD' ? (mov.qty || 0) : 0,
              qtyOut: mov.movement_type !== 'INWARD' ? Math.abs(mov.qty || 0) : 0,
              balance: mov.qty || 0,
              godown: mov.godown_id ? `Godown ${mov.godown_id}` : 'Main Warehouse',
              operator: 'System'
            }));
          }
        } catch (e) {
          console.warn('Inventory stock ledger endpoint fallback', e);
        }

        if (mapped.length === 0) {
          const res = await erpStockAPI.getMovements();
          const data = res.data || [];
          mapped = data.map(mov => ({
            id: mov.id,
            date: mov.timestamp ? new Date(mov.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
            sku: mov.item_id,
            type: ['RECEIPT', 'QC_UPDATE', 'INWARD'].includes(mov.transaction_type) ? 'Inward' : 'Outward',
            ref: mov.tracking_id || '-',
            qtyIn: mov.quantity > 0 ? mov.quantity : 0,
            qtyOut: mov.quantity < 0 ? Math.abs(mov.quantity) : 0,
            balance: mov.quantity || 0,
            godown: mov.location_type || 'Main Warehouse',
            operator: mov.user_id || 'System'
          }));
        }
        setLedgerData(mapped);
      } catch (err) {
        console.error('Failed to fetch ledger:', err);
        setLedgerData([]);
      }
    };

    fetchLedgerData();
  }, []);

  const filteredLedger = useMemo(() => {
    return ledgerData.filter(item => {
      const matchesSearch = (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.ref || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = txnTypeFilter === 'All Transactions' || item.type === txnTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, txnTypeFilter, ledgerData]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLedger);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Ledger');
    XLSX.writeFile(wb, `Stock_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={24} color="var(--primary)" /> Stock Ledger (Transaction Audit Trail)
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Detailed historical register of item receipt, issue, and adjustment transactions.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div
          className="card stat-card"
          onClick={() => setTxnTypeFilter('All Transactions')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Transactions</h3>
            <div className="value">{ledgerData.length}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => setTxnTypeFilter('Inward')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <ArrowDownLeft size={24} />
          </div>
          <div className="stat-details">
            <h3>Inward Receipts</h3>
            <div className="value">{ledgerData.filter(i => i.type === 'Inward').length}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => setTxnTypeFilter('Outward')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-details">
            <h3>Outward Issues</h3>
            <div className="value">{ledgerData.filter(i => i.type === 'Outward').length}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Volume In (Qty)</h3>
            <div className="value">{ledgerData.reduce((acc, i) => acc + (Number(i.qtyIn) || 0), 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search SKU Name, Reference Doc..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
        <select className="form-control" style={{ width: 220, margin: 0 }} value={txnTypeFilter} onChange={e => setTxnTypeFilter(e.target.value)}>
          <option>All Transactions</option>
          <option>Inward</option>
          <option>Outward</option>
        </select>
      </div>

      {/* Audit List Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Date</th>
              <th>SKU / Product Description</th>
              <th>Type</th>
              <th>Reference Document</th>
              <th style={{ textAlign: 'right' }}>Qty Inwarded</th>
              <th style={{ textAlign: 'right' }}>Qty Issued</th>
              <th style={{ textAlign: 'right' }}>Running Balance</th>
              <th>Godown Location</th>
              <th>Logged By</th>
            </tr>
          </thead>
          <tbody>
            {filteredLedger.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700 }}>{item.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color="var(--text-muted)" />
                    {item.date}
                  </div>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.sku}</td>
                <td>
                  <span className={`badge ${item.type === 'Inward' ? 'badge-active' : 'badge-rose'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {item.type === 'Inward' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    {item.type}
                  </span>
                </td>
                <td style={{ fontWeight: 650, fontFamily: 'monospace' }}>{item.ref}</td>
                <td style={{ textAlign: 'right', color: item.qtyIn > 0 ? 'var(--success)' : 'inherit', fontWeight: item.qtyIn > 0 ? 600 : 'normal' }}>
                  {item.qtyIn > 0 ? `+ ${item.qtyIn.toLocaleString()}` : '-'}
                </td>
                <td style={{ textAlign: 'right', color: item.qtyOut > 0 ? 'var(--danger)' : 'inherit', fontWeight: item.qtyOut > 0 ? 600 : 'normal' }}>
                  {item.qtyOut > 0 ? `- ${item.qtyOut.toLocaleString()}` : '-'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{(item.balance || 0).toLocaleString()}</td>
                <td>{item.godown}</td>
                <td>{item.operator}</td>
              </tr>
            ))}
            {filteredLedger.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No transaction audit entries match the selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
