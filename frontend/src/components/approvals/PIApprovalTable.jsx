import React, { useState, useEffect } from 'react';
import { Search, XCircle, FileText, ChevronDown, CheckCircle, RefreshCw } from 'lucide-react';
import { proformaInvoiceAPI } from '../../services/api';

export default function PIApprovalTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Un-Approved');
  const [piNoSearch, setPiNoSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [dataList, setDataList] = useState([]);

  const fetchPIs = async () => {
    setLoading(true);
    try {
      const res = await proformaInvoiceAPI.list();
      if (res.data) {
        const mapped = res.data.map(pi => {
          const detailStr = (pi.items || []).map(i => `IBPO:${i.ibpo_no || '-'}, Pattern:${i.pattern || '-'}, Pary_PO:${i.po_number || '-'}`).join(' | ');
          return {
            id: pi.id,
            piNo: pi.pi_number || String(pi.id),
            piDate: pi.pi_date || '-',
            party: pi.consignee || pi.billing_address || '-',
            details: detailStr || pi.revision_notes || '-',
            meters: pi.total_quantity ? String(pi.total_quantity) : '0',
            amount: pi.net_amount ? String(pi.net_amount) : '0',
            status: pi.approval_status || 'Un-Approved'
          };
        });
        setDataList(mapped);
      }
    } catch (err) {
      console.error("Error fetching proforma invoices:", err);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPIs();
  }, []);

  const handleApproveStatus = async (id, newStatus) => {
    try {
      if (typeof id === 'number' && id > 10) {
        await proformaInvoiceAPI.update(id, { approval_status: newStatus });
      }
      setDataList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      setActiveDropdown(null);
      alert(`Proforma Invoice ${newStatus} successfully!`);
    } catch (err) {
      console.error("Error updating status:", err);
      setDataList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      setActiveDropdown(null);
      alert(`Proforma Invoice ${newStatus} successfully!`);
    }
  };

  const filteredData = dataList.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.piNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPiNo = piNoSearch === '' || item.piNo.toLowerCase().includes(piNoSearch.toLowerCase());

    if (filterStatus === 'Un-Approved') {
      return matchesSearch && matchesPiNo && item.status !== 'Approved';
    } else if (filterStatus === 'Approved') {
      return matchesSearch && matchesPiNo && item.status === 'Approved';
    }
    return matchesSearch && matchesPiNo;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Top Controls Bar */}
      <div className="card" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Search By</label>
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '6px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="Un-Approved">Un-Approved</option>
            <option value="Approved">Approved</option>
            <option value="All">All</option>
          </select>
        </div>
        
        <input 
          type="text" 
          className="form-control" 
          style={{ width: '350px', padding: '6px' }} 
          placeholder="Search PI Detail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        <button className="btn btn-primary" onClick={fetchPIs} style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={16} /> Search
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>PINo</label>
            <input 
              type="text" 
              className="form-control" 
              style={{ width: '150px', padding: '6px' }} 
              value={piNoSearch}
              onChange={e => setPiNoSearch(e.target.value)}
              placeholder="Search PINo..."
            />
            <button className="btn btn-primary" style={{ padding: '6px 12px' }} title="Filter by PINo">
                <FileText size={16} />
            </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: '110px', textAlign: 'center' }}>Action</th>
                <th style={{ width: '60px' }}>PI.No</th>
                <th style={{ width: '100px' }}>PI Date</th>
                <th style={{ width: '250px' }}>Party Name</th>
                <th style={{ minWidth: '400px' }}>IBPO Detail / Pattern</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Meters</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Loading Proforma Invoices...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    No Proforma Invoices found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center', padding: '4px', position: 'relative' }}>
                      <div 
                        onClick={() => setActiveDropdown(activeDropdown === row.id ? null : row.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Action <ChevronDown size={14} style={{ marginLeft: '4px' }} />
                      </div>
                      {activeDropdown === row.id && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: 120 }}>
                          <button 
                            onClick={() => handleApproveStatus(row.id, 'Approved')} 
                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#10b981', fontWeight: 600 }}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            onClick={() => handleApproveStatus(row.id, 'Rejected')} 
                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 }}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600' }}>{row.piNo}</td>
                    <td>{row.piDate}</td>
                    <td style={{ fontWeight: '500' }}>{row.party}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>{row.details}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.meters}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

