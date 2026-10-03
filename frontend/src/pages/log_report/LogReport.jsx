import { useState, useEffect } from 'react';
import { Activity, Search, Download, Calendar, Users, Eye, HelpCircle, ShieldCheck, Database, RefreshCw, FileText } from 'lucide-react';
import { logReportAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function LogReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States (Recreating the laptop filter bar exactly)
  const [moduleFilter, setModuleFilter] = useState('-');
  const [modeFilter, setModeFilter] = useState('-');
  const [remarksFilter, setRemarksFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [givenPeriod, setGivenPeriod] = useState(false);
  const [userIdFilter, setUserIdFilter] = useState('-');
  const [textSearch, setTextSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Query parameters for backend filtering if requested
      const params = {};
      if (moduleFilter !== '-') params.module = moduleFilter;
      if (modeFilter !== '-') params.mode = modeFilter;
      if (userIdFilter !== '-') params.user_id = userIdFilter;
      if (textSearch) params.search = textSearch;

      const { data } = await logReportAPI.list(params);
      setLogs(data);
    } catch (err) {
      console.error("Error loading system audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return dateStr;
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = dt.getDate();
      const month = months[dt.getMonth()];
      const year = dt.getFullYear();
      
      const hours = dt.getHours().toString().padStart(2, '0');
      const minutes = dt.getMinutes().toString().padStart(2, '0');
      const seconds = dt.getSeconds().toString().padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Client-side date and remarks filtering (supports local given period checkbox)
  const filteredLogs = logs.filter(log => {
    // Remarks filter
    if (remarksFilter && !log.remarks?.toLowerCase().includes(remarksFilter.toLowerCase())) {
      return false;
    }

    // Given period date filter
    if (givenPeriod && log.log_date) {
      const logTime = new Date(log.log_date);
      if (fromDate) {
        const fTime = new Date(fromDate);
        if (logTime < fTime) return false;
      }
      if (toDate) {
        const tTime = new Date(toDate);
        tTime.setHours(23, 59, 59);
        if (logTime > tTime) return false;
      }
    }

    return true;
  });

  const exportExcel = () => {
    const wsData = filteredLogs.map(log => ({
      "Date": formatDate(log.log_date),
      "User Name": log.user_name || '-',
      "User ID": log.user_id || '-',
      "Mode": log.mode || '-',
      "Module": log.module || '-',
      "Remarks": log.remarks || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "System Logs");
    XLSX.writeFile(wb, `System_Audit_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("HANDLOOM ERP - System Audit & Log Report", 14, 15);
    const tableColumn = ["Date", "User Name", "User ID", "Mode", "Module", "Remarks"];
    const tableRows = [];

    filteredLogs.forEach(log => {
      const rowData = [
        formatDate(log.log_date),
        log.user_name || '-',
        log.user_id || '-',
        log.mode || '-',
        log.module || '-',
        log.remarks || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: { 5: { cellWidth: 120 } }
    });
    doc.save(`System_Audit_Log_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Distinct values for filter options
  const uniqueModules = Array.from(new Set(logs.map(l => l.module).filter(Boolean)));
  const uniqueModes = Array.from(new Set(logs.map(l => l.mode).filter(Boolean)));
  const uniqueUsers = Array.from(new Set(logs.map(l => l.user_id).filter(Boolean)));

  return (
    <div className="animate-fade">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={24} color="#64748b" /> Log Report & Audit Trail
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>System-wide user activity logs, transaction records, and security audit details.</p>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} /> Refresh logs
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
            <Database size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Audit Logs</h3>
            <div className="value">{logs.length} Recs</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Authorized Users</h3>
            <div className="value">{uniqueUsers.length} Users</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-details">
            <h3>Security Status</h3>
            <div className="value" style={{ color: '#10b981' }}>Secure</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Activity size={24} />
          </div>
          <div className="stat-details">
            <h3>Monitored Modules</h3>
            <div className="value">{uniqueModules.length} Modules</div>
          </div>
        </div>
      </div>

      {/* LAPTOP-STYLE TOP FILTER INTERFACE */}
      <div className="card" style={{ padding: 24, marginBottom: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        
        {/* ROW 1: MODULE, TYPE/MODE, DETAILS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Module</label>
            <select className="form-control" style={{ margin: 0 }} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
              <option value="-">-</option>
              {uniqueModules.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Type/Mode</label>
            <select className="form-control" style={{ margin: 0 }} value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
              <option value="-">-</option>
              {uniqueModes.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Details/Remarks</label>
            <input 
              className="form-control" 
              style={{ margin: 0 }} 
              value={remarksFilter} 
              onChange={e => setRemarksFilter(e.target.value)} 
            />
          </div>
        </div>

        {/* ROW 2: DATES, GIVEN PERIOD, USER ID, SEARCH BUTTON */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr 1.2fr 1fr', gap: 20, alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>From Date</label>
            <input type="date" className="form-control" style={{ margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} disabled={!givenPeriod} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>To Date</label>
            <input type="date" className="form-control" style={{ margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} disabled={!givenPeriod} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%', paddingTop: 20 }}>
            <input 
              type="checkbox" 
              id="givenPeriodCheckbox" 
              style={{ width: 18, height: 18, cursor: 'pointer' }}
              checked={givenPeriod}
              onChange={e => setGivenPeriod(e.target.checked)}
            />
            <label htmlFor="givenPeriodCheckbox" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', margin: 0, color: givenPeriod ? '#10b981' : 'var(--text-muted)' }}>
              Given Period
            </label>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>UserID</label>
            <select className="form-control" style={{ margin: 0 }} value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)}>
              <option value="-">-</option>
              {uniqueUsers.map((u, idx) => (
                <option key={idx} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div style={{ paddingTop: 20 }}>
            <button 
              className="btn" 
              style={{ width: '100%', background: '#b91c1c', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleSearchClick}
            >
              <Search size={16} /> Search
            </button>
          </div>
        </div>

        {/* SUB ROW: TEXT SEARCH AND EXPORT ACTION BAR */}
        <div style={{ display: 'flex', gap: 16, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 600 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                value={textSearch}
                onChange={e => setTextSearch(e.target.value)}
              />
            </div>
            <button 
              className="btn" 
              style={{ background: '#b91c1c', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleSearchClick}
            >
              Search
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Total Reco : {filteredLogs.length}
            </span>
            <button 
              className="btn" 
              style={{ background: '#15803d', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={exportExcel}
            >
              <Download size={16} /> Export Excel
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={exportPDF}
            >
              <FileText size={16} color="#ef4444" /> Export PDF
            </button>
          </div>
        </div>

      </div>

      {/* TABLE AUDIT LISTING */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border)' }}>
        <table className="data-table" style={{ margin: 0, minWidth: 1200 }}>
          <thead>
            <tr>
              <th style={{ width: 180 }}>Date</th>
              <th style={{ width: 140 }}>User Name</th>
              <th style={{ width: 120 }}>User ID</th>
              <th style={{ width: 100 }}>Mode</th>
              <th style={{ width: 150 }}>Module</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>Loading audit trail...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>No audit logs matched the filter criteria.</td></tr>
            ) : (
              filteredLogs.map(log => (
                <tr 
                  key={log.id} 
                  style={{
                    backgroundColor: log.user_id === 'EDP001' ? 'rgba(59,130,246,0.02)' : 'transparent',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(log.log_date)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.user_name || '-'}</td>
                  <td>
                    <span className="badge badge-active" style={{ background: log.user_id ? 'rgba(100,116,139,0.1)' : 'transparent', color: 'var(--text-primary)' }}>
                      {log.user_id || '-'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: log.mode === 'Save' ? '#10b981' : '#f59e0b' }}>{log.mode || '-'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{log.module || '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '1.4', padding: '12px 16px' }}>{log.remarks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
