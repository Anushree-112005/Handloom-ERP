import React, { useState, useEffect } from 'react';
import { Package, Search, Download, Filter, Printer } from 'lucide-react';
import { ppcAPI } from '../../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrderWiseProduction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    order_id: 'All',
    buyer_name: 'All',
    status: 'All'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Generate realistic mock data for Order-wise report
      const mockOrders = Array.from({length: 5}).map((_, i) => {
        const total = 30000 + (i * 10000);
        const produced = Math.floor(total * (Math.random() * 0.5 + 0.3));
        const remaining = total - produced;
        const completion = (produced / total) * 100;
        const looms = Math.floor(Math.random() * 3) + 2;
        
        let status = '✅ On Track';
        if (completion < 50 && i > 2) status = '❌ Delayed';
        else if (completion < 60) status = '⚠️ At Risk';

        return {
          id: i,
          order_id: `ORD-2024-${String(i+1).padStart(3, '0')}`,
          buyer_name: i % 2 === 0 ? 'H&M Sweden' : 'Zara Spain',
          fabric_type: i % 2 === 0 ? 'Cotton Poplin' : 'Denim Twill',
          order_date: '2026-05-01',
          delivery_date: '2026-07-10',
          total_ordered: total,
          total_produced: produced,
          remaining_meters: remaining,
          completion: completion,
          looms_assigned: looms,
          downtime: Math.floor(Math.random() * 20),
          lost_meters: Math.floor(Math.random() * 400),
          current_eta: '2026-06-22',
          buffer_days: status === '❌ Delayed' ? -2 : 18,
          status: status
        };
      });
      
      setData(mockOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Order-wise Production Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${filters.fromDate} to ${filters.toDate}`, 14, 22);
    
    autoTable(doc, {
      startY: 28,
      head: [['Order ID', 'Buyer', 'Total(m)', 'Produced(m)', 'Rem(m)', 'Comp(%)', 'Looms', 'Down(hr)', 'Lost(m)', 'ETA', 'Status']],
      body: data.map(d => [
        d.order_id, d.buyer_name, d.total_ordered, d.total_produced, d.remaining_meters,
        d.completion.toFixed(1), d.looms_assigned, d.downtime, d.lost_meters, d.current_eta, d.status
      ]),
    });
    doc.save(`Order_Production_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({
      'Order ID': d.order_id, 'Buyer Name': d.buyer_name, 'Fabric': d.fabric_type,
      'Order Date': d.order_date, 'Delivery Date': d.delivery_date,
      'Total Ordered(m)': d.total_ordered, 'Produced(m)': d.total_produced,
      'Remaining(m)': d.remaining_meters, 'Completion(%)': d.completion.toFixed(1),
      'Looms Assigned': d.looms_assigned, 'Downtime(hrs)': d.downtime,
      'Lost(m)': d.lost_meters, 'Current ETA': d.current_eta,
      'Buffer Days': d.buffer_days, 'Status': d.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order Production");
    XLSX.writeFile(wb, `Order_Production_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalOrders = data.length;
  const totalOrdered = data.reduce((sum, d) => sum + d.total_ordered, 0);
  const totalProduced = data.reduce((sum, d) => sum + d.total_produced, 0);
  const totalRemaining = data.reduce((sum, d) => sum + d.remaining_meters, 0);
  const ordersOnTrack = data.filter(d => d.status.includes('On Track')).length;
  const ordersDelayed = data.filter(d => d.status.includes('Delayed')).length;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package style={{ color: 'var(--primary)' }} /> Order-wise Production Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Monitor progress, delays, and completion status of active orders</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', borderColor: '#10b981' }}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Filter Parameters</h4>
          <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: 12 }}>Report ID: OWP-001</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>From Date</label>
            <input type="date" className="form-control" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>To Date</label>
            <input type="date" className="form-control" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Order ID</label>
            <select className="form-control" value={filters.order_id} onChange={e => setFilters({...filters, order_id: e.target.value})}>
              <option value="All">All Orders</option>
              <option value="ORD-2024-001">ORD-2024-001</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Buyer Name</label>
            <select className="form-control" value={filters.buyer_name} onChange={e => setFilters({...filters, buyer_name: e.target.value})}>
              <option value="All">All Buyers</option>
              <option value="H&M">H&M Sweden</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Status</label>
            <select className="form-control" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Fabric Type</th>
                <th>Ordered (m)</th>
                <th>Produced (m)</th>
                <th>Rem. (m)</th>
                <th>Comp. %</th>
                <th>Looms</th>
                <th>ETA Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 40 }}>Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 40 }}>No order data found.</td></tr>
              ) : data.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.order_id}</td>
                  <td>{row.buyer_name}</td>
                  <td>{row.fabric_type}</td>
                  <td style={{ fontWeight: 600 }}>{row.total_ordered.toLocaleString()}</td>
                  <td style={{ color: '#047857', fontWeight: 600 }}>{row.total_produced.toLocaleString()}</td>
                  <td style={{ color: '#b45309' }}>{row.remaining_meters.toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${row.completion}%`, height: '100%', background: 'var(--primary)' }}></div>
                      </div>
                      <span style={{ width: 35, textAlign: 'right' }}>{row.completion.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>{row.looms_assigned}</td>
                  <td>{row.current_eta}</td>
                  <td style={{ fontWeight: 600 }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ background: 'var(--bg-secondary)', padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Orders</div><div style={{ fontWeight: 700, fontSize: 16 }}>{totalOrders}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Ordered</div><div style={{ fontWeight: 700, fontSize: 16 }}>{totalOrdered.toLocaleString()} m</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Produced</div><div style={{ fontWeight: 700, fontSize: 16, color: '#047857' }}>{totalProduced.toLocaleString()} m</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Remaining</div><div style={{ fontWeight: 700, fontSize: 16, color: '#b45309' }}>{totalRemaining.toLocaleString()} m</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Orders On Track</div><div style={{ fontWeight: 700, fontSize: 16, color: '#047857' }}>{ordersOnTrack}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Orders Delayed</div><div style={{ fontWeight: 700, fontSize: 16, color: '#b91c1c' }}>{ordersDelayed}</div></div>
        </div>
      </div>
    </div>
  );
}
