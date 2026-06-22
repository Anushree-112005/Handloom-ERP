import { useState, useMemo } from 'react';
import { Box, Search, Download, Filter, Layers, Database, ArrowRightLeft, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function YarnStock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [countFilter, setCountFilter] = useState('All Counts');
  const [godownFilter, setGodownFilter] = useState('All Godowns');

  // Premium Curated Mock Data for Yarn Stock
  const MOCK_STOCK = [
    { id: 1, count: '40s Karded Cotton', mill: 'Vardhman Mills', lotNo: 'LOT-40K-902', bags: 120, netWeight: 5400, rate: 265, godown: 'Main Warehouse', status: 'Available' },
    { id: 2, count: '60s Combed Cotton', mill: 'Super Spinning Mills', lotNo: 'LOT-60C-811', bags: 85, netWeight: 3825, rate: 310, godown: 'Main Warehouse', status: 'Available' },
    { id: 3, count: '80s Giza Cotton', mill: 'Nahar Spinning', lotNo: 'LOT-80G-102', bags: 45, netWeight: 2025, rate: 420, godown: 'Dyeing Godown', status: 'Reserved' },
    { id: 4, count: '2/40s Dyed Yarn', mill: 'Dinesh Dyeing Unit', lotNo: 'LOT-240D-55', bags: 60, netWeight: 2700, rate: 295, godown: 'Warping Godown', status: 'Available' },
    { id: 5, count: '30s Melange', mill: 'Soma Textiles', lotNo: 'LOT-30M-419', bags: 90, netWeight: 4050, rate: 245, godown: 'Main Warehouse', status: 'Available' },
    { id: 6, count: '50s Lycra Yarn', mill: 'Vardhman Mills', lotNo: 'LOT-50L-703', bags: 30, netWeight: 1350, rate: 380, godown: 'Warping Godown', status: 'Reserved' },
    { id: 7, count: '2/80s Mercerized', mill: 'Dinesh Dyeing Unit', lotNo: 'LOT-280M-12', bags: 50, netWeight: 2250, rate: 485, godown: 'Dyeing Godown', status: 'Available' }
  ];

  const countsList = useMemo(() => {
    return ['All Counts', ...new Set(MOCK_STOCK.map(item => item.count))];
  }, []);

  const godownsList = useMemo(() => {
    return ['All Godowns', ...new Set(MOCK_STOCK.map(item => item.godown))];
  }, []);

  const filteredStock = useMemo(() => {
    return MOCK_STOCK.filter(item => {
      const matchesSearch = item.mill.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.count.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCount = countFilter === 'All Counts' || item.count === countFilter;
      const matchesGodown = godownFilter === 'All Godowns' || item.godown === godownFilter;
      return matchesSearch && matchesCount && matchesGodown;
    });
  }, [searchTerm, countFilter, godownFilter]);

  const stats = useMemo(() => {
    const totalBags = filteredStock.reduce((acc, item) => acc + item.bags, 0);
    const totalKgs = filteredStock.reduce((acc, item) => acc + item.netWeight, 0);
    const totalValuation = filteredStock.reduce((acc, item) => acc + (item.netWeight * item.rate), 0);
    return { totalBags, totalKgs, totalValuation };
  }, [filteredStock]);

  const exportExcel = () => {
    const data = filteredStock.map(item => ({
      'Yarn Count': item.count,
      'Mill Name': item.mill,
      'Lot No': item.lotNo,
      'Bags': item.bags,
      'Net Weight (Kgs)': item.netWeight,
      'Rate (₹/Kg)': item.rate,
      'Godown Location': item.godown,
      'Total Value (₹)': item.netWeight * item.rate,
      'Status': item.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yarn Stock');
    XLSX.writeFile(wb, `Yarn_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('portrait');
    doc.text('Dinesh Exports - Yarn Stock Summary', 14, 15);
    const headers = [['Yarn Count', 'Mill', 'Lot No', 'Bags', 'Net Wt (Kgs)', 'Godown']];
    const rows = filteredStock.map(item => [
      item.count,
      item.mill,
      item.lotNo,
      item.bags,
      `${item.netWeight} Kg`,
      item.godown
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Yarn_Stock_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={24} color="var(--primary)" /> Yarn Stock Ledger
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time lot-wise yarn stock position across godowns.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} /> PDF
          </button>
          <button className="btn btn-primary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Excel Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <Database size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Bags</h3>
            <div className="value" style={{ fontSize: 24, fontWeight: 800 }}>{stats.totalBags} Bags</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(8, 145, 178, 0.1)', color: 'var(--secondary)' }}>
            <Layers size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Weight</h3>
            <div className="value" style={{ fontSize: 24, fontWeight: 800 }}>{stats.totalKgs.toLocaleString()} Kgs</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}>
            <ArrowRightLeft size={24} />
          </div>
          <div className="stat-details">
            <h3>Valuation</h3>
            <div className="value" style={{ fontSize: 24, fontWeight: 800 }}>₹{stats.totalValuation.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Lot No, Count, Mill..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
        <select className="form-control" style={{ width: 200, margin: 0 }} value={countFilter} onChange={e => setCountFilter(e.target.value)}>
          {countsList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-control" style={{ width: 200, margin: 0 }} value={godownFilter} onChange={e => setGodownFilter(e.target.value)}>
          {godownsList.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Yarn Count</th>
              <th>Mill Name</th>
              <th>Lot Number</th>
              <th style={{ textAlign: 'right' }}>Bags</th>
              <th style={{ textAlign: 'right' }}>Net Weight (Kgs)</th>
              <th style={{ textAlign: 'right' }}>Rate (₹/Kg)</th>
              <th style={{ textAlign: 'right' }}>Total Value</th>
              <th>Godown</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.count}</td>
                <td>{item.mill}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.lotNo}</td>
                <td style={{ textAlign: 'right' }}>{item.bags}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.netWeight} Kg</td>
                <td style={{ textAlign: 'right' }}>₹{item.rate}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(item.netWeight * item.rate).toLocaleString()}</td>
                <td>{item.godown}</td>
                <td>
                  <span className={`badge ${item.status === 'Available' ? 'badge-active' : 'badge-pending'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredStock.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No stock records match the selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
