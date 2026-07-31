import { useState, useEffect, useMemo } from 'react';
import { Box, Search, Download, Filter, Layers, Database, ArrowRightLeft, FileText, Eye } from 'lucide-react';
import api, { erpStockAPI, yarnInwardAPI } from '../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function YarnStock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [countFilter, setCountFilter] = useState('All Counts');
  const [godownFilter, setGodownFilter] = useState('All Godowns');
  const [colorFilter, setColorFilter] = useState('All Colors');
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        let stockItems = [];
        
        // Primary source: Lot-wise items from Yarn Inwards
        try {
          const resInward = await yarnInwardAPI.list();
          if (resInward.data && resInward.data.length > 0) {
            const items = [];
            resInward.data.forEach(inward => {
              (inward.items || []).forEach((item, idx) => {
                if (item.yarn_count || item.lot_no) {
                  const qty = Number(item.kgs) || 0;
                  const rate = Number(item.rate) || 300;
                  items.push({
                    id: item.id || `${inward.id}-${idx}`,
                    count: item.yarn_count || 'N/A',
                    mill: item.mill_name || inward.received_from || 'Premier Mills',
                    colour: item.colour || '-',
                    lotNo: item.lot_no || 'N/A',
                    bags: Number(item.bags) || (qty > 0 ? Math.round(qty / 50) : 0),
                    netWeight: qty,
                    rate: rate,
                    godown: inward.stock_godown || (inward.godown_id ? `Godown ${inward.godown_id}` : 'Main Warehouse'),
                    status: inward.status === 'Received' ? 'Available' : (inward.status || 'Available')
                  });
                }
              });
            });
            if (items.length > 0) {
              stockItems = items;
            }
          }
        } catch (e) {
          console.warn('Yarn inward list fetch fallback', e);
        }

        // Fallback 1: Stock Summary API
        if (stockItems.length === 0) {
          try {
            const res = await inventoryAPI.getStockSummary();
            if (res.data && res.data.length > 0) {
              stockItems = res.data.map(item => {
                const qty = item.closing_qty || 0;
                const val = item.closing_value || 0;
                const unitRate = qty > 0 ? (val / qty) : 300;
                return {
                  id: item.id,
                  count: item.item_name || item.item_code || 'N/A',
                  mill: 'Premier Mills',
                  lotNo: item.lot_no || 'LOT-MAIN',
                  bags: Math.round(qty / 50) || (qty > 0 ? 1 : 0),
                  netWeight: qty,
                  rate: unitRate,
                  godown: item.godown_id ? `Godown ${item.godown_id}` : 'Main Warehouse',
                  status: item.status === 'AVAILABLE' ? 'Available' : 'Reserved',
                  colour: ''
                };
              });
            }
          } catch (e) {
            console.warn('Inventory stock summary endpoint fallback', e);
          }
        }

        // Fallback 2: ERP Current Stock API
        if (stockItems.length === 0) {
          const { data } = await erpStockAPI.getCurrentStock('?category=yarn');
          stockItems = (data || []).map(item => ({
            id: item.id,
            count: item.item_id || 'N/A', 
            mill: 'Premier Mills',
            lotNo: item.batch_id || item.lot_id || 'N/A',
            bags: Math.round((item.quantity || 0) / 50) || ((item.quantity || 0) > 0 ? 1 : 0),
            netWeight: item.quantity || 0,
            rate: 300, 
            godown: item.location_type || 'Main Warehouse',
            status: item.status === 'AVAILABLE' ? 'Available' : 'Reserved',
            colour: ''
          }));
        }

        setStock(stockItems);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setStock([]);
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  const countsList = useMemo(() => {
    return ['All Counts', ...new Set(stock.map(item => item.count))];
  }, [stock]);

  const godownsList = useMemo(() => {
    return ['All Godowns', ...new Set(stock.map(item => item.godown))];
  }, [stock]);

  const colorsList = useMemo(() => {
    return ['All Colors', ...new Set(stock.map(item => item.colour).filter(Boolean))];
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchesSearch = item.mill.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.count.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.colour && item.colour.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCount = countFilter === 'All Counts' || item.count === countFilter;
      const matchesGodown = godownFilter === 'All Godowns' || item.godown === godownFilter;
      const matchesColor = colorFilter === 'All Colors' || item.colour === colorFilter;
      return matchesSearch && matchesCount && matchesGodown && matchesColor;
    });
  }, [stock, searchTerm, countFilter, godownFilter, colorFilter]);

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
      'Color': item.colour || '-',
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
    const headers = [['Yarn Count', 'Mill', 'Color', 'Lot No', 'Bags', 'Net Wt (Kgs)', 'Godown']];
    const rows = filteredStock.map(item => [
      item.count,
      item.mill,
      item.colour || '-',
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
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading yarn stock data...</p>
        </div>
      ) : (
      <>
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
            placeholder="Search by Lot No, Count, Mill, Color..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
        <select className="form-control" style={{ width: 180, margin: 0 }} value={countFilter} onChange={e => setCountFilter(e.target.value)}>
          {countsList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-control" style={{ width: 180, margin: 0 }} value={colorFilter} onChange={e => setColorFilter(e.target.value)}>
          {colorsList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-control" style={{ width: 180, margin: 0 }} value={godownFilter} onChange={e => setGodownFilter(e.target.value)}>
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
              <th>Color</th>
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
                <td>
                  {item.colour ? (
                    <span className="badge badge-secondary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                      {item.colour}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
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
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {stock.length === 0 ? 'No stock data available. Record yarn inward receipts first.' : 'No stock records match the selection.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
