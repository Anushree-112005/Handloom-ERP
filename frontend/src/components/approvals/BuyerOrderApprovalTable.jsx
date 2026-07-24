import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Edit2, FileText } from 'lucide-react';

export default function BuyerOrderApprovalTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Unverify');

  // Mock data based on the screenshot
  const mockData = [
    { id: 1, refNo: '9962', piDate: '18-Jul-2026', poNo: '9962', buyer: 'KSP INDIA', agent: '-', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '-', qlty: '10 SLUB X 10 SLUB // 60 x 48 - 2/1 TWILL', mtrs: '30.00', rate: '350.00', amount: '10500.00' },
    { id: 2, refNo: '9963', piDate: '18-Jul-2026', poNo: '9963', buyer: 'KSP INDIA', agent: '-', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '-', qlty: '40 + 2/80 x 40 HT // 80 x 64 - DOBBY', mtrs: '100.00', rate: '350.00', amount: '35000.00' },
    { id: 3, refNo: '9964', piDate: '18-Jul-2026', poNo: '9964', buyer: 'KSP INDIA', agent: '-', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '-', qlty: '60 + 2/20 x 60 + 2/20 // 92 x 72 - DOBBY', mtrs: '100.00', rate: '350.00', amount: '35000.00' },
    { id: 4, refNo: '9965', piDate: '18-Jul-2026', poNo: '9965', buyer: 'RICHACO EXPORTS PRIVATE LIMITED', agent: '-', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '-', qlty: '60X60/104X88-plain', mtrs: '10.00', rate: '550.00', amount: '5500.00' },
    { id: 5, refNo: '9966', piDate: '18-Jul-2026', poNo: '9966', buyer: 'RICHACO EXPORTS PRIVATE LIMITED', agent: '-', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '-', qlty: '60X60/104X88-plain', mtrs: '10.00', rate: '550.00', amount: '5500.00' },
    { id: 6, refNo: '9967', piDate: '18-Jul-2026', poNo: '9967', buyer: 'ADITYA BIRLA LIFESTYLE BRANDS LIMITED', agent: 'DIRECT PARTY', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '93', qlty: '305 T X 305 T 120X72/63-2/1 TWILL', mtrs: '7200.00', rate: '1.00', amount: '7560.00' },
    { id: 7, refNo: '9968', piDate: '18-Jul-2026', poNo: '9968', buyer: 'VISHWAA APPARELS - I', agent: '-', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '1067', qlty: '60MX60M/165X104 (G) SATIN', mtrs: '50.00', rate: '150.00', amount: '7500.00' },
    { id: 8, refNo: '9942', piDate: '17-Jul-2026', poNo: '9942', buyer: 'AQUASNS FASHIONS PRIVATE LIMITED', agent: '-', payment: '-', comPercent: '.00', comMtr: '.00', shortNo: '2897', qlty: '60x60HT /66X56 PLAIN (g)', mtrs: '25500.00', rate: '1.00', amount: '26775.00' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Top Controls Bar */}
      <div className="card" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Search By</label>
          <select className="form-control" style={{ width: '150px', padding: '6px' }}>
            <option>Ref No</option>
            <option>Buyer Name</option>
            <option>Po No</option>
          </select>
        </div>
        
        <input 
          type="text" 
          className="form-control" 
          style={{ width: '250px', padding: '6px' }} 
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        <select 
          className="form-control" 
          style={{ width: '150px', padding: '6px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="Unverify">Unverify</option>
          <option value="Verified">Verified</option>
          <option value="All">All</option>
        </select>
        
        <button className="btn btn-primary" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search size={16} /> Search
        </button>
        <button className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={16} /> Verify
        </button>
        <button className="btn btn-outline" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <XCircle size={16} /> Exit
        </button>
      </div>

      {/* Main Table */}
      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table className="data-table" style={{ width: '100%', whiteSpace: 'nowrap', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>Select</th>
                <th style={{ width: '40px', textAlign: 'center' }}>Action</th>
                <th>Ref No</th>
                <th>PI Date</th>
                <th>Po No</th>
                <th>Buyer Name</th>
                <th>Agent Name</th>
                <th>Payment Detail</th>
                <th style={{ textAlign: 'right' }}>Com %</th>
                <th style={{ textAlign: 'right' }}>Com/Mtr</th>
                <th>Short No</th>
                <th style={{ minWidth: '350px' }}>Qlty</th>
                <th style={{ textAlign: 'right' }}>Mtrs</th>
                <th style={{ textAlign: 'right' }}>Party Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((row) => (
                <tr key={row.id}>
                  <td style={{ textAlign: 'center' }}><input type="checkbox" style={{ cursor: 'pointer' }} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <Edit2 size={16} />
                    </button>
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} style={{ color: 'var(--text-muted)' }} /> {row.refNo}
                    </div>
                  </td>
                  <td>{row.piDate}</td>
                  <td>{row.poNo}</td>
                  <td style={{ fontWeight: '500' }}>{row.buyer}</td>
                  <td>{row.agent}</td>
                  <td>{row.payment}</td>
                  <td style={{ textAlign: 'right' }}>{row.comPercent}</td>
                  <td style={{ textAlign: 'right' }}>{row.comMtr}</td>
                  <td>{row.shortNo}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.qlty}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.mtrs}</td>
                  <td style={{ textAlign: 'right' }}>{row.rate}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

