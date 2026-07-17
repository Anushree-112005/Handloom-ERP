import { useState, useMemo, useEffect } from 'react';
import { Activity, Search, RefreshCw, Send, CheckCircle2, AlertTriangle, ArrowRightLeft, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  dyedYarnDeliveryAPI,
  dyedYarnReceiptAPI,
  warpDeliveryAPI,
  warpBeamReceiptAPI,
  clothInwardAPI,
  clothDeliveryAPI,
  finishedFabricAPI
} from '../../services/api';

export default function JobWorkStatus() {
  const [searchTerm, setSearchTerm] = useState('');
  const [workerFilter, setWorkerFilter] = useState('All Workers');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const [
        yarnDelRes,
        yarnRecRes,
        warpDelRes,
        warpRecRes,
        clothInwRes,
        clothDelRes,
        finFabricRes
      ] = await Promise.all([
        dyedYarnDeliveryAPI.list().catch(() => ({ data: [] })),
        dyedYarnReceiptAPI.list().catch(() => ({ data: [] })),
        warpDeliveryAPI.list().catch(() => ({ data: [] })),
        warpBeamReceiptAPI.list().catch(() => ({ data: [] })),
        clothInwardAPI.list().catch(() => ({ data: [] })),
        clothDeliveryAPI.list().catch(() => ({ data: [] })),
        finishedFabricAPI.list().catch(() => ({ data: [] }))
      ]);

      const yarnDeliveries = yarnDelRes.data || [];
      const yarnReceipts = yarnRecRes.data || [];
      const warpDeliveries = warpDelRes.data || [];
      const warpReceipts = warpRecRes.data || [];
      const clothInwards = clothInwRes.data || [];
      const clothDeliveries = clothDelRes.data || [];
      const finishedFabrics = finFabricRes.data || [];

      // Weaving Deliveries from localStorage
      let weavingDeliveries = [];
      try {
        const saved = localStorage.getItem('dt_weaving_delivery_records');
        if (saved) {
          weavingDeliveries = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }

      // 1. Yarn Dyeing
      const yarnJobs = yarnDeliveries.map(d => {
        const matchingRecs = yarnReceipts.filter(r => r.our_dc_no === d.dc_no);
        const qtySent = parseFloat(d.total_dely_kgs) || 0;
        const qtyReceived = matchingRecs.reduce((sum, r) => sum + (parseFloat(r.total_received_qty) || 0), 0);
        const loss = Math.max(0, qtySent - qtyReceived);
        const progress = qtySent > 0 ? Math.min(100, Math.round((qtyReceived / qtySent) * 100)) : 0;
        const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Sent';
        const details = d.design_no ? `Design: ${d.design_no}` : (d.items?.map(i => `${i.count || ''} ${i.color || ''}`).filter(Boolean).join(', ') || 'Yarn Dyeing');

        return {
          id: d.dc_no || `YDD-${d.id}`,
          date: d.dc_date ? d.dc_date.substring(0, 10) : d.ref_date ? d.ref_date.substring(0, 10) : '-',
          workerName: d.party_name || 'Unknown Processor',
          type: 'Yarn Dyeing',
          details,
          qtySent,
          qtyReceived,
          loss: parseFloat(loss.toFixed(2)),
          progress,
          status,
          unit: 'Kg'
        };
      });

      // 2. Warping
      const warpJobs = warpDeliveries.map(d => {
        const matchingRecs = warpReceipts.filter(r => r.siz_dc_no === d.dc_no);
        const qtySent = parseFloat(d.total_meters) || 0;
        const qtyReceived = matchingRecs.reduce((sum, r) => sum + (parseFloat(r.warp_meters) || 0), 0);
        const loss = Math.max(0, qtySent - qtyReceived);
        const progress = qtySent > 0 ? Math.min(100, Math.round((qtyReceived / qtySent) * 100)) : 0;
        const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Sent';
        let details = '';
        if (d.design_no) details += `Design: ${d.design_no}`;
        if (d.set_id) details += `${details ? ', ' : ''}Set: ${d.set_id}`;
        if (!details) details = 'Warping Beam';

        return {
          id: d.dc_no || `WD-${d.id}`,
          date: d.dc_date ? d.dc_date.substring(0, 10) : '-',
          workerName: d.party_name || d.sizing_name || 'Unknown Processor',
          type: 'Warping',
          details,
          qtySent,
          qtyReceived,
          loss: parseFloat(loss.toFixed(2)),
          progress,
          status,
          unit: 'Mtr'
        };
      });

      // 3. Weaving
      const weavingJobs = weavingDeliveries.map(d => {
        const matchingRecs = clothInwards.filter(r => r.inward_type === 'Grey Inward' && r.our_delivery_ref === d.id);
        const qtySent = d.items?.reduce((sum, item) => sum + (parseFloat(item.length) || 0), 0) || 0;
        const qtyReceived = matchingRecs.reduce((sum, r) => sum + (parseFloat(r.total_meters) || 0), 0);
        const loss = Math.max(0, qtySent - qtyReceived);
        const progress = qtySent > 0 ? Math.min(100, Math.round((qtyReceived / qtySent) * 100)) : 0;
        const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Sent';
        let details = '';
        if (d.design_no) details += `Design: ${d.design_no}`;
        if (d.loomNo) details += `${details ? ', ' : ''}Loom: ${d.loomNo}`;
        if (!details) details = 'Weaving Beam';

        return {
          id: d.id,
          date: d.date ? d.date.substring(0, 10) : '-',
          workerName: d.party_name || 'Unknown Weaver',
          type: 'Weaving',
          details,
          qtySent,
          qtyReceived,
          loss: parseFloat(loss.toFixed(2)),
          progress,
          status,
          unit: 'Mtr'
        };
      });

      // 4. Fabric Dyeing
      const dyeingDeliveries = clothDeliveries.filter(d => d.process_type === 'Dyeing');
      const dyeingJobs = dyeingDeliveries.map(d => {
        const matchingRecs = finishedFabrics.filter(r => {
          if (r.process_type !== 'Dyeing' && r.process_type !== 'Dyed') {
            try {
              if (r.remarks) {
                const parsed = JSON.parse(r.remarks);
                if (parsed.receipt_process !== 'Dyeing') return false;
              } else {
                return false;
              }
            } catch (e) {
              return false;
            }
          }
          try {
            if (r.remarks) {
              const parsed = JSON.parse(r.remarks);
              return parsed.dyeing_delivery_no === d.dc_no || parsed.gry_dc_no === d.dc_no;
            }
          } catch (e) {}
          return r.dc_no === d.dc_no || r.ref_no === d.dc_no;
        });

        const qtySent = parseFloat(d.total_meters || d.delivery_mtr) || 0;
        const qtyReceived = matchingRecs.reduce((sum, r) => sum + (parseFloat(r.total_meters) || 0), 0);
        const loss = Math.max(0, qtySent - qtyReceived);
        const progress = qtySent > 0 ? Math.min(100, Math.round((qtyReceived / qtySent) * 100)) : 0;
        const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Sent';
        let details = '';
        if (d.design_no) details += `Design: ${d.design_no}`;
        if (d.fabric_detail) details += `${details ? ', ' : ''}${d.fabric_detail}`;
        if (!details) details = 'Fabric Dyeing';

        return {
          id: d.dc_no || `FDD-${d.id}`,
          date: d.dc_date ? d.dc_date.substring(0, 10) : '-',
          workerName: d.party_name || 'Unknown Dyeing Processor',
          type: 'Fabric Dyeing',
          details,
          qtySent,
          qtyReceived,
          loss: parseFloat(loss.toFixed(2)),
          progress,
          status,
          unit: 'Mtr'
        };
      });

      // 5. Finishing
      const finishingDeliveries = clothDeliveries.filter(d => d.process_type === 'Finishing');
      const finishingJobs = finishingDeliveries.map(d => {
        const matchingRecs = finishedFabrics.filter(r => {
          if (r.process_type !== 'Finishing' && r.process_type !== 'Finished') {
            try {
              if (r.remarks) {
                const parsed = JSON.parse(r.remarks);
                if (parsed.receipt_process !== 'Finishing') return false;
              } else {
                return false;
              }
            } catch (e) {
              return false;
            }
          }
          try {
            if (r.remarks) {
              const parsed = JSON.parse(r.remarks);
              return parsed.gry_dc_no === d.dc_no || parsed.dyeing_delivery_no === d.dc_no;
            }
          } catch (e) {}
          return r.dc_no === d.dc_no || r.ref_no === d.dc_no;
        });

        const qtySent = parseFloat(d.total_meters || d.delivery_mtr) || 0;
        const qtyReceived = matchingRecs.reduce((sum, r) => sum + (parseFloat(r.total_meters) || 0), 0);
        const loss = Math.max(0, qtySent - qtyReceived);
        const progress = qtySent > 0 ? Math.min(100, Math.round((qtyReceived / qtySent) * 100)) : 0;
        const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Sent';
        let details = '';
        if (d.design_no) details += `Design: ${d.design_no}`;
        if (d.fabric_detail) details += `${details ? ', ' : ''}${d.fabric_detail}`;
        if (!details) details = 'Fabric Finishing';

        return {
          id: d.dc_no || `FFD-${d.id}`,
          date: d.dc_date ? d.dc_date.substring(0, 10) : '-',
          workerName: d.party_name || 'Unknown Finisher',
          type: 'Finishing',
          details,
          qtySent,
          qtyReceived,
          loss: parseFloat(loss.toFixed(2)),
          progress,
          status,
          unit: 'Mtr'
        };
      });

      setJobs([
        ...yarnJobs,
        ...warpJobs,
        ...weavingJobs,
        ...dyeingJobs,
        ...finishingJobs
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const workersList = useMemo(() => {
    return ['All Workers', ...new Set(jobs.map(job => job.workerName))];
  }, [jobs]);

  const typesList = useMemo(() => {
    return ['All Types', ...new Set(jobs.map(job => job.type))];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = (job.workerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (job.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (job.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWorker = workerFilter === 'All Workers' || job.workerName === workerFilter;
      const matchesType = typeFilter === 'All Types' || job.type === typeFilter;
      return matchesSearch && matchesWorker && matchesType;
    });
  }, [jobs, searchTerm, workerFilter, typeFilter]);

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
            <h3>{summary.totalSent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
            <p>Total Material Sent</p>
          </div>
        </div>
        <div className="card stat-card" style={{ '--stat-color': 'var(--success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}><CheckCircle2 size={22} /></div>
          <div className="stat-info">
            <h3>{summary.totalRecd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
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
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ display: 'inline-block', marginRight: 8 }} /> Loading job work status...
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                  No job work entries found.
                </td>
              </tr>
            ) : (
              filteredJobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 700 }}>{job.id}</td>
                  <td>{job.date}</td>
                  <td style={{ fontWeight: 600 }}>{job.workerName}</td>
                  <td>{job.type}</td>
                  <td>{job.details}</td>
                  <td style={{ textAlign: 'right' }}>{job.qtySent.toLocaleString(undefined, { maximumFractionDigits: 2 })} {job.unit}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{job.qtyReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} {job.unit}</td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{job.loss > 0 ? `${job.loss.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${job.unit}` : '-'}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
