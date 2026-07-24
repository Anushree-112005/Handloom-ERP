import React, { useState } from 'react';
import { Search, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

export default function VendorOrderApprovalTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Unverify');
  const [remarks, setRemarks] = useState('');

  const mockData = [
    { id: 1, orderNo: '14643', orderDate: '18-Jul-2026', vendor: 'SHRI SHAKTHI WEAVING', designNo: 'DEPL000-9557', construction: '16 X 12 / 104 X 62 / 63 / C TWILL', warpMtr: '3800.00', pickRate: '1.00', orderMtr: '3800.00' },
    { id: 2, orderNo: '14642', orderDate: '17-Jul-2026', vendor: 'S R WARPING', designNo: 'DEPL000-9926', construction: '20 x20 /72 x 60 (F) Dobby FW 56', warpMtr: '800.00', pickRate: '1.00', orderMtr: '800.00' },
    { id: 3, orderNo: '14641', orderDate: '17-Jul-2026', vendor: 'ANNAMAR TEX', designNo: 'MTM000-2635', construction: '40S X 2/30S / 110 X 52 / OXFORD - 58', warpMtr: '120.00', pickRate: '1.00', orderMtr: '120.00' },
    { id: 4, orderNo: '14640', orderDate: '17-Jul-2026', vendor: 'THANUKANI TEX', designNo: 'DEPL000-9736', construction: '60 + 2/40 x 40 // 68 x 68 - LENO DOBBY', warpMtr: '140.00', pickRate: '11500.00', orderMtr: '140.00' },
    { id: 5, orderNo: '14639', orderDate: '17-Jul-2026', vendor: 'SHASHTI TEX', designNo: 'DEPL000-9790', construction: '40X40/120X80-D.C', warpMtr: '2130.00', pickRate: '25', orderMtr: '2130.00' },
    { id: 6, orderNo: '14638', orderDate: '17-Jul-2026', vendor: 'THANUKANI TEX', designNo: 'DEPL000-9795', construction: '40+2/40x40/80x76(G)-Dobby 63', warpMtr: '195.00', pickRate: '11000.00', orderMtr: '195.00' },
    { id: 7, orderNo: '14637', orderDate: '17-Jul-2026', vendor: 'THANUKANI TEX', designNo: 'MTM000-2610', construction: '21VL X 21VL / 60 X 52 / PLAIN - 58', warpMtr: '140.00', pickRate: '1.00', orderMtr: '140.00' },
    { id: 8, orderNo: '14636', orderDate: '17-Jul-2026', vendor: 'SIVALINGA TEX', designNo: 'DEPL000-9827', construction: '30SF SLUB X 30SF SLUB // 80 X 60 - DOBBY', warpMtr: '140.00', pickRate: '8000.00', orderMtr: '140.00' },
    { id: 9, orderNo: '14635', orderDate: '17-Jul-2026', vendor: 'MI TEXTILES', designNo: 'DEPL000-9799', construction: '16 X 10SL X 80 X 50 / 56 / H.BONE', warpMtr: '290.00', pickRate: '10000.00', orderMtr: '290.00' },
    { id: 10, orderNo: '14634', orderDate: '17-Jul-2026', vendor: 'S.M.V TEX', designNo: 'DEPL000-9808', construction: '2/40X2/20/104X62 -3/1TWILL', warpMtr: '450.00', pickRate: '11000.00', orderMtr: '450.00' },
  ];

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
        </select>
        
        <input 
          type="text" 
          className="form-control" 
          style={{ width: '300px', padding: '6px' }} 
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        <button className="btn btn-primary" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search size={16} /> Search
        </button>
        
        <button className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={16} /> Verify
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Remarks</label>
            <input 
              type="text" 
              className="form-control" 
              style={{ width: '250px', padding: '6px' }} 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
        </div>
        
        <button className="btn btn-outline" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <XCircle size={16} /> Unverify
        </button>
      </div>

      {/* Main Table */}
      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table className="data-table" style={{ width: '100%', whiteSpace: 'nowrap', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
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
              {mockData.map((row) => (
                <tr key={row.id}>
                  <td style={{ textAlign: 'center', padding: '4px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        Action <ChevronDown size={14} style={{ marginLeft: '4px' }} />
                    </div>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
