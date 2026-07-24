import React, { useState, useEffect, useMemo } from 'react';
import { storesService } from '../../../services/storesService';
import { 
  BarChart3, Search, Download, RefreshCw, AlertTriangle, Layers, Users, Package, PieChart as PieIcon, FileText, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function ConsumptionReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await storesService.getConsumptionReport({
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
        department: departmentFilter,
        category: categoryFilter
      });
      setData(response || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Consumption report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo, departmentFilter, categoryFilter]);

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Consumption Report', 14, 15);
    doc.setFontSize(10);
    
    const headers = [['Issue No', 'Department', 'Item', 'Category', 'Issued', 'Returned', 'Net Consumption', 'Issue Date', 'Issued By']];
    const body = data.map(row => [
      row.issue_number,
      row.department,
      row.item_name,
      row.category,
      row.issued_qty,
      row.returned_qty,
      row.net_consumption,
      row.issue_date,
      row.issued_by
    ]);
    
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20
    });
    
    doc.save(`Consumption_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `Consumption_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filteredData = data.filter(item => 
    !searchTerm || 
    item.issue_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Summary Metrics
  const totalConsumption = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.net_consumption) || 0), 0);
  
  const deptMap = {};
  const itemMap = {};
  const catMap = {};
  const monthMap = {};

  filteredData.forEach(row => {
    const net = parseFloat(row.net_consumption) || 0;
    
    deptMap[row.department] = (deptMap[row.department] || 0) + net;
    itemMap[row.item_name] = (itemMap[row.item_name] || 0) + net;
    catMap[row.category] = (catMap[row.category] || 0) + net;
    
    // YYYY-MM
    const month = row.issue_date ? row.issue_date.substring(0, 7) : 'Unknown';
    monthMap[month] = (monthMap[month] || 0) + net;
  });

  const highestDept = Object.keys(deptMap).reduce((a, b) => deptMap[a] > deptMap[b] ? a : b, 'None');
  const mostConsumedItem = Object.keys(itemMap).reduce((a, b) => itemMap[a] > itemMap[b] ? a : b, 'None');

  const deptChartData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));
  const catChartData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
  const monthChartData = Object.entries(monthMap).sort().map(([name, value]) => ({ name, value }));

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <BarChart3 size={26} style={{ color: '#6366f1' }} />
            Consumption Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>Track department-wise consumption.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Download size={16} style={{ color: '#15803d' }} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <FileText size={16} style={{ color: '#6366f1' }} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={fetchReport} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Layers size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Total Consumption</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{totalConsumption.toLocaleString()}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <Users size={24} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Highest Dept</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {highestDept}
            </h3>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <Package size={24} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Most Consumed Item</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {mostConsumedItem}
            </h3>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Current Month</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
              {monthMap[new Date().toISOString().substring(0, 7)] || 0}
            </h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Monthly Consumption</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Department-wise</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {deptChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Category-wise</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Issue No, Dept, Item..." 
            className="form-control"
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          <input type="text" className="form-control" style={{ width: 130, margin: 0 }} placeholder="Department" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} />
          
          <input type="text" className="form-control" style={{ width: 130, margin: 0 }} placeholder="Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading report data...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 16px' }} />
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No records found matching criteria.</div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Issue No</th>
                    <th>Department</th>
                    <th>Item</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Issued Qty</th>
                    <th style={{ textAlign: 'right' }}>Returned Qty</th>
                    <th style={{ textAlign: 'right' }}>Net Consumption</th>
                    <th>Issue Date</th>
                    <th>Issued By</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.issue_number}</td>
                      <td>{row.department}</td>
                      <td style={{ color: '#6366f1' }}>{row.item_name}</td>
                      <td>{row.category}</td>
                      <td style={{ textAlign: 'right' }}>{row.issued_qty}</td>
                      <td style={{ textAlign: 'right', color: row.returned_qty > 0 ? '#10b981' : 'inherit' }}>{row.returned_qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.net_consumption}</td>
                      <td>{row.issue_date}</td>
                      <td>{row.issued_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  className="btn-secondary" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px' }}
                >
                  Prev
                </button>
                <button 
                  className="btn-secondary" 
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
