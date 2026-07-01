import { useState, useMemo } from 'react';
import { Activity, Search, RefreshCw, Send, CheckCircle2, AlertTriangle, ArrowRightLeft, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function JobWorkStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [workerFilter, setWorkerFilter] = useState('All Workers');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const MOCK_JOBS = [];

  const workersList = useMemo(() => {
    return ['All Workers', ...new Set(MOCK_JOBS.map(job => job.workerName))];
  }, []);

  const typesList = useMemo(() => {
    return ['All Types', ...new Set(MOCK_JOBS.map(job => job.type))];
  }, []);

  const filteredJobs = useMemo(() => {
    return MOCK_JOBS.filter(job => {
      const matchesSearch = job.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            job.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            job.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWorker = workerFilter === 'All Workers' || job.workerName === workerFilter;
      const matchesType = typeFilter === 'All Types' || job.type === typeFilter;
      return matchesSearch && matchesWorker && matchesType;
    });
  }, [searchTerm, workerFilter, typeFilter]);

  const summary = useMemo(() => {
    const totalJobs = filteredJobs.length;
    const pendingJobs = filteredJobs.filter(j => j.status !== 'Completed').length;
    const totalSent = filteredJobs.reduce((acc, j) => acc + j.qtySent, 0);
    const totalRecd = filteredJobs.reduce((acc, j) => acc + j.qtyReceived, 0);
    return { totalJobs, pendingJobs, totalSent, totalRecd };
  }, [filteredJobs]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredJobs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Job Work Status');
    XLSX.writeFile(wb, `Job_Work_Status_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={24} color="var(--primary)" /> Job Work Operations Monitor
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Track raw yarn and greige fabric sent to external processors.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <div className="card stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}><Activity size={22} /></div>
          <div className="stat-info">
            <h3>{summary.totalJobs}</h3>
            <p>Total Job Orders</p>
          </div>
        </div>
        <div className="card stat-card" style={{ '--stat-color': 'var(--warning)' }}>
          <div className="stat-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)' }}><Send size={22} /></div>
          <div className="stat-info">
            <h3>{summary.pendingJobs}</h3>
            <p>Active/Pending Orders</p>
          </div>
        </div>
        <div className="card stat-card" style={{ '--stat-color': 'var(--info)' }}>
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--info)' }}><RefreshCw size={22} /></div>
          <div className="stat-info">
            <h3>{summary.totalSent.toLocaleString()} Mtr/Kg</h3>
            <p>Total Material Sent</p>
          </div>
        </div>
        <div className="card stat-card" style={{ '--stat-color': 'var(--success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}><CheckCircle2 size={22} /></div>
          <div className="stat-info">
            <h3>{summary.totalRecd.toLocaleString()} Mtr/Kg</h3>
            <p>Total Material Received</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by Job ID, Details or Party..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
        <select className="form-control" style={{ width: 200, margin: 0 }} value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}>
          {workersList.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select className="form-control" style={{ width: 200, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {typesList.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Grid Directory */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Order Date</th>
              <th>Processor Name</th>
              <th>Process Type</th>
              <th>Material Details</th>
              <th style={{ textAlign: 'right' }}>Qty Sent</th>
              <th style={{ textAlign: 'right' }}>Qty Received</th>
              <th style={{ textAlign: 'right' }}>Process Loss</th>
              <th>Yield / Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(job => (
              <tr key={job.id}>
                <td style={{ fontWeight: 700 }}>{job.id}</td>
                <td>{job.date}</td>
                <td style={{ fontWeight: 600 }}>{job.workerName}</td>
                <td>{job.type}</td>
                <td>{job.details}</td>
                <td style={{ textAlign: 'right' }}>{job.qtySent.toLocaleString()}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{job.qtyReceived.toLocaleString()}</td>
                <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{job.loss > 0 ? `${job.loss} Units` : '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, minWidth: 60, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${job.progress}%`, background: job.progress === 100 ? 'var(--success)' : 'var(--primary)' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 750 }}>{job.progress}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${job.status === 'Completed' ? 'badge-active' : job.status === 'Sent' ? 'badge-draft' : 'badge-pending'}`}>
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
