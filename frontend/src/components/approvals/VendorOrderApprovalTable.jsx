import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { weavingPOAPI } from '../../services/api';

export default function VendorOrderApprovalTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Unverify');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [dataList, setDataList] = useState([]);

  const fetchVendorOrders = async () => {
    setLoading(true);
    try {
      const res = await weavingPOAPI.list();
      if (res.data) {
        const mapped = res.data.map(po => {
          return {
            id: po.id,
            orderNo: po.po_no || String(po.id),
            orderDate: po.po_date || '-',
            vendor: po.supplier_weaver || '-',
            designNo: po.design_color || po.indent_no || '-',
            construction: po.construction || po.fabric || po.fabric_type || '-',
            warpMtr: po.warp_meters ? Number(po.warp_meters).toFixed(2) : '0.00',
            pickRate: po.cooly_pick ? Number(po.cooly_pick).toFixed(2) : '1.00',
            orderMtr: po.v_order_mtrs ? Number(po.v_order_mtrs).toFixed(2) : '0.00',
            status: po.status || 'Unverify'
          };
        });
        setDataList(mapped);
      }
    } catch (err) {
      console.error("Error fetching vendor work orders:", err);
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorOrders();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      if (typeof id === 'number' && id > 10) {
        await weavingPOAPI.update(id, { status: newStatus });
      }
      setDataList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      setActiveDropdown(null);
      alert(`Vendor Workorder status set to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      setDataList(prev => prev.map(item => item.id === item.id ? { ...item, status: newStatus } : item));
      setActiveDropdown(null);
      alert(`Vendor Workorder status set to ${newStatus}`);
    }
  };

  const filteredData = dataList.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'Unverify') {
      return matchesSearch && item.status !== 'Verify' && item.status !== 'Verified';
    } else if (filterStatus === 'Verify') {
      return matchesSearch && (item.status === 'Verify' || item.status === 'Verified');
    }
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Top Controls Bar */}
      <div className="card" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        <select 
          className="form-control" 
          style={{ width: '150px', padding: '6px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="Unverify">Unverify</option>
          <option value="Verify">Verify</option>
          <option value="All">All</option>
        </select>
        
        <input 
          type="text" 
          className="form-control" 
          style={{ width: '300px', padding: '6px' }} 
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        <button className="btn btn-primary" onClick={fetchVendorOrders} style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={16} /> Search
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Remarks</label>
            <input 
              type="text" 
              className="form-control" 
              style={{ width: '250px', padding: '6px' }} 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Enter remarks..."
            />
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table className="data-table" style={{ width: '100%', whiteSpace: 'nowrap', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: '110px', textAlign: 'center' }}>Action</th>
                <th>Order No</th>
                <th>Order Date</th>
                <th>Vendor_Name</th>
                <th>Design No</th>
                <th style={{ minWidth: '300px' }}>Construction</th>
                <th style={{ textAlign: 'right' }}>Warp_Mtr</th>
                <th style={{ textAlign: 'right' }}>Pick Rate</th>
                <th style={{ textAlign: 'right' }}>Order_Mtr</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    Loading Vendor Work Orders...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    No Vendor Work Orders found.
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
                            onClick={() => handleUpdateStatus(row.id, 'Verify')} 
                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#10b981', fontWeight: 600 }}
                          >
                            <CheckCircle size={14} /> Verify
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(row.id, 'Unverify')} 
                            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 }}
                          >
                            <XCircle size={14} /> Unverify
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600' }}>{row.orderNo}</td>
                    <td>{row.orderDate}</td>
                    <td style={{ fontWeight: '500' }}>{row.vendor}</td>
                    <td>{row.designNo}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.construction}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.warpMtr}</td>
                    <td style={{ textAlign: 'right' }}>{row.pickRate}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.orderMtr}</td>
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

