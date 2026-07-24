import React, { useState } from 'react';
import { Search, XCircle, FileText, ChevronDown } from 'lucide-react';

export default function PIApprovalTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Un-Approved');

  const mockData = [
    { id: 1, piNo: '70', piDate: '17-Jul-2026', party: 'JYOTI ENTERPRISES INDIA', details: 'IBPO:9320, Pattern:MONO CHECK - SEER SUCKER/, Pary_PO: JEI-813', meters: '3465', amount: '563929' },
    { id: 2, piNo: '69', piDate: '16-Jul-2026', party: 'MAGNOLIA MARTINIQUE CLOTHING PVT. LTD.,', details: 'IBPO:6906, Pattern:SATIN GREIGE /, Pary_PO: MAIL', meters: '20', amount: '8106' },
    { id: 3, piNo: '68', piDate: '08-Jul-2026', party: 'STRANGE EXPORTS PVT LTD', details: 'IBPO:9797, Pattern:BLUE BREEZE/COTTON, Pary_PO: AWT PO | IBPO:9798, Pattern:IVORY EGRET/COTTON, Pary_PO: AWT PO', meters: '1260', amount: '456435' },
    { id: 4, piNo: '67', piDate: '08-Jul-2026', party: 'PEARL GLOBAL INDUSTRIES LTD- BLR', details: 'IBPO:9239, Pattern:OFF WHITE /, Pary_PO: BY MAIL', meters: '1400', amount: '183750' },
    { id: 5, piNo: '66', piDate: '08-Jul-2026', party: 'ELAND APPAREL LIMITED', details: 'IBPO:9363, Pattern:Indigo Multi YD Stripe/, Pary_PO: MAIL CONFIRMATION | IBPO:9364, Pattern:Neutral Multi YD Stripe/, Pary_PO: MAIL CONFIRMATION | IBPO:9365, Pattern:Blue Mix Chambray YD/, Pary_PO: MAIL CONFIRMATION | IBPO:9366, Pattern:Neutral Mix Chambray YD/, Pary_PO: MAIL CONFIRMATION | IBPO:9367, Pattern:Paper White-Solid/, Pary_PO: MAIL CONFIRMATION', meters: '410', amount: '193725' },
    { id: 6, piNo: '65', piDate: '07-Jul-2026', party: 'SILVER SPARK APPAREL LIMITED(YELAHANKA OFFICE).', details: 'IBPO:7604, Pattern:GREY/, Pary_PO: PMN007/SINGON', meters: '1935', amount: '412445' },
    { id: 7, piNo: '64', piDate: '06-Jul-2026', party: 'ACHIEVER APPARELS PVT. LTD.,', details: 'IBPO:9745, Pattern:GREEN WHITE STRIPE /, Pary_PO: SAMPLING', meters: '50', amount: '23625' },
    { id: 8, piNo: '63', piDate: '01-Jul-2026', party: 'SILVER SPARK APPAREL LIMITED(KANCHEEPURAM)', details: 'IBPO:7603, Pattern:GREEN/, Pary_PO: PMN007/SINGON', meters: '2101.8', amount: '447999' },
  ];

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
        
        <button className="btn btn-primary" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Search
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>PINo</label>
            <input type="text" className="form-control" style={{ width: '150px', padding: '6px' }} />
            <button className="btn btn-primary" style={{ padding: '6px 12px' }}>
                <FileText size={16} />
            </button>
        </div>
        
        <button className="btn btn-outline" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Close
        </button>
      </div>

      {/* Main Table */}
      <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                <th style={{ width: '60px' }}>PI.No</th>
                <th style={{ width: '100px' }}>PI Date</th>
                <th style={{ width: '250px' }}>Party Name</th>
                <th style={{ minWidth: '400px' }}>IBPO Detail / Pattern</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Meters</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Amount</th>
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
                  <td style={{ fontWeight: '600' }}>{row.piNo}</td>
                  <td>{row.piDate}</td>
                  <td style={{ fontWeight: '500' }}>{row.party}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>{row.details}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{row.meters}</td>
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
