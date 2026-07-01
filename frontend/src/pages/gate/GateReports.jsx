import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Search, Download, Printer, Filter, ChevronRight, 
  Calendar, RefreshCw, BarChart2, Shield, AlertTriangle 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { partyAPI } from '../../services/api';

export default function GateReports() {
  // Compute KPIs dynamically from localStorage data
  const computeKpis = () => {
    const inwardData = JSON.parse(localStorage.getItem('gate_inward_data') || '[]');
    const outwardData = JSON.parse(localStorage.getItem('gate_outward_data') || '[]');
    const passData = JSON.parse(localStorage.getItem('gate_pass_data') || '[]');
    const today = new Date().toISOString().substring(0, 10);

    const todayInwards = inwardData.filter(i => i.dateTime === today).length;
    const activeInYard = inwardData.filter(i => i.status === 'Open').length;
    const openPasses = passData.filter(p => p.status === 'Open').length;
    const returnablePending = passData.filter(p => p.passType === 'Returnable' && p.status === 'Open').length;

    return [
      { label: "Today's Inwards", value: `${todayInwards} Vehicles`, change: `Total: ${inwardData.length}`, color: "#10b981" },
      { label: "Active Inside Yard", value: `${activeInYard} Vehicles`, change: "Current open inwards", color: "#f59e0b" },
      { label: "Open Gate Passes", value: `${openPasses} Passes`, change: `${returnablePending} Returnable pending`, color: "#4f46e5" },
      { label: "Total Outwards", value: `${outwardData.length} Records`, change: "All dispatched outwards", color: "#ef4444" }
    ];
  };
  const kpis = computeKpis();

  const [partiesList, setPartiesList] = useState([]);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await partyAPI.list();
        if (res.data && res.data.length > 0) {
          setPartiesList(res.data.map(p => p.company_name));
        }
      } catch (err) {
        console.error("Failed to fetch parties in GateReports", err);
      }
    };
    fetchParties();
  }, []);

  // Combined master report dataset
  const [masterLogs, setMasterLogs] = useState(() => {
    const inwardData = JSON.parse(localStorage.getItem('gate_inward_data') || '[]');
    const outwardData = JSON.parse(localStorage.getItem('gate_outward_data') || '[]');
    const passData = JSON.parse(localStorage.getItem('gate_pass_data') || '[]');

    const formattedInwards = inwardData.map(i => ({
      id: i.id,
      type: 'Inward',
      dateTime: i.dateTime,
      partyName: i.partyName,
      vehicleNo: i.vehicleNo,
      item: i.materialType,
      qty: i.qty,
      unit: i.unit,
      purpose: i.purpose,
      guard: i.guardName,
      status: i.status
    }));

    const formattedOutwards = outwardData.map(o => ({
      id: o.id,
      type: 'Outward',
      dateTime: o.dateTime,
      partyName: o.partyName,
      vehicleNo: o.vehicleNo,
      item: o.materialType,
      qty: o.qty,
      unit: o.unit,
      purpose: o.purpose,
      guard: o.guardName,
      status: o.status
    }));

    const formattedPasses = passData.map(p => ({
      id: p.id,
      type: 'Gate Pass',
      dateTime: p.passDate,
      partyName: p.partyName,
      vehicleNo: p.vehicleNo,
      item: p.items?.[0]?.name || 'N/A',
      qty: p.items?.[0]?.qty || 0,
      unit: p.items?.[0]?.unit || 'Nos',
      purpose: p.purpose,
      guard: 'Security',
      status: p.status
    }));

    return [...formattedInwards, ...formattedOutwards, ...formattedPasses];
  });

  // Tab State
  const [activeTab, setActiveTab] = useState('Inward'); // 'Inward' | 'Outward' | 'Pass' | 'PendingPass' | 'Vehicle' | 'Summary'

  // Filter values
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedParty, setSelectedParty] = useState('All');
  const [selectedMaterialType, setSelectedMaterialType] = useState('All');
  const [selectedPurpose, setSelectedPurpose] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [vehicleQuery, setVehicleQuery] = useState('');

  // Dropdown list generation
  const parties = useMemo(() => {
    return partiesList.length > 0 ? partiesList : ['Raymond Ltd', 'Reliance Retail', 'Vardhman Spinning', 'Chemical Traders'];
  }, [partiesList]);
  const materialTypes = ['Yarn', 'Fabric / Cloth', 'Dyes & Chemicals', 'Spare Parts', 'Machinery', 'Others'];
  const purposes = ['Sales Delivery', 'Job Work Out', 'Material Return', 'Sample Dispatch', 'Machinery Out', 'Others'];

  // Filter logic
  const filteredData = useMemo(() => {
    return masterLogs.filter(row => {
      // 1. Tab base type filter
      if (activeTab === 'Inward' && row.type !== 'Inward') return false;
      if (activeTab === 'Outward' && row.type !== 'Outward') return false;
      if (activeTab === 'Pass' && row.type !== 'Gate Pass') return false;
      
      if (activeTab === 'PendingPass') {
        if (row.type !== 'Gate Pass' || row.status !== 'Open') return false;
      }

      // 2. Date Range filters
      if (dateFrom && row.dateTime.substring(0, 10) < dateFrom) return false;
      if (dateTo && row.dateTime.substring(0, 10) > dateTo) return false;

      // 3. Common Search Filters
      if (selectedParty !== 'All' && row.partyName !== selectedParty) return false;
      if (selectedStatus !== 'All' && row.status !== selectedStatus) return false;
      if (vehicleQuery && !String(row.vehicleNo || '').toLowerCase().includes(vehicleQuery.toLowerCase())) return false;
      
      // 4. Custom criteria for specific registers
      if (activeTab === 'Inward' && selectedMaterialType !== 'All') {
        if (!row.item) return false;
        const itemLower = String(row.item).toLowerCase();
        const query = String(selectedMaterialType).toLowerCase().split(' ')[0];
        if (!itemLower.includes(query)) return false;
      }

      if (activeTab === 'Outward' && selectedPurpose !== 'All' && row.purpose !== selectedPurpose) return false;

      return true;
    });
  }, [masterLogs, activeTab, dateFrom, dateTo, selectedParty, selectedMaterialType, selectedPurpose, selectedStatus, vehicleQuery]);

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(row => ({
      'Gate / Pass No': row.id,
      'Type': row.type,
      'Date & Time': row.dateTime,
      'Party Name': row.partyName,
      'Vehicle No': row.vehicleNo,
      'Material / Item': row.item,
      'Quantity': row.qty,
      'Unit': row.unit,
      'Purpose': row.purpose,
      'Security Guard': row.guard,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gate Report');
    XLSX.writeFile(workbook, `Gate_${activeTab}_Register.xlsx`);
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('helvetica', 'bold');
    doc.text(`DINESH EXPORTS TEXTILE ERP — GATE ${activeTab.toUpperCase()} REGISTER`, 14, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString().substring(0, 10)} | Checkpost Audit Module`, 14, 21);

    const headers = [['Gate No', 'Date & Time', 'Party Name', 'Vehicle No', 'Material / Item', 'Qty', 'Purpose', 'Guard', 'Status']];
    const data = filteredData.map(row => [
      row.id,
      row.dateTime,
      row.partyName,
      row.vehicleNo,
      row.item,
      `${row.qty} ${row.unit}`,
      row.purpose,
      row.guard,
      row.status
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 26,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Gate_${activeTab}_Register.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <BarChart2 size={26} style={{ color: '#4f46e5' }} /> Gate & Security Reports Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            Comprehensive material checkpost logs, vehicle weight registers, and pending returnable gate pass summaries
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Download size={16} style={{ color: '#15803d' }} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <FileText size={16} style={{ color: '#4f46e5' }} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className="card animate-fade" style={{ borderLeft: `4px solid ${kpi.color}`, padding: '20px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{kpi.label}</span>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>{kpi.value}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{kpi.change}</span>
          </div>
        ))}
      </div>

      {/* REPORT TYPE SELECTOR TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '24px' }}>
        {[
          { key: 'Inward', label: 'Gate Inward Register' },
          { key: 'Outward', label: 'Gate Outward Register' },
          { key: 'Pass', label: 'Gate Pass Register' },
          { key: 'PendingPass', label: 'Pending Gate Passes' },
          { key: 'Vehicle', label: 'Vehicle Movement' },
          { key: 'Summary', label: 'Material In-Out Summary' }
        ].map(tab => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedParty('All');
                setSelectedMaterialType('All');
                setSelectedPurpose('All');
                setSelectedStatus('All');
                setVehicleQuery('');
              }}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                color: isSelected ? '#4f46e5' : 'var(--text-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} /> Filter Settings for {activeTab}
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'flex-end' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Date From</label>
            <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ margin: 0, fontSize: '13px' }} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Date To</label>
            <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ margin: 0, fontSize: '13px' }} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Party Name</label>
            <select className="form-control" value={selectedParty} onChange={e => setSelectedParty(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
              <option value="All">All Parties</option>
              {parties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {activeTab === 'Inward' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Material Type</label>
              <select className="form-control" value={selectedMaterialType} onChange={e => setSelectedMaterialType(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                <option value="All">All Types</option>
                {materialTypes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          {activeTab === 'Outward' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Purpose</label>
              <select className="form-control" value={selectedPurpose} onChange={e => setSelectedPurpose(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                <option value="All">All Purposes</option>
                {purposes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {activeTab === 'Pass' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Pass Status</label>
              <select className="form-control" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Used">Used</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Vehicle No.</label>
            <input type="text" className="form-control" placeholder="Search vehicle" value={vehicleQuery} onChange={e => setVehicleQuery(e.target.value)} style={{ margin: 0, fontSize: '13px' }} />
          </div>

        </div>
      </div>

      {/* DYNAMIC REPORTS TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {activeTab} Register Ledger
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredData.length} records matching current filter scope
            </span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handlePrint}>
            <Printer size={12} /> Print Ledger
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', margin: 0, minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Gate / Pass No</th>
                <th>Date & Time</th>
                <th>Party Name</th>
                <th>Vehicle No</th>
                <th>Material / Item</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th>Purpose</th>
                <th>Security Guard</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No checkpost records found matching this filter scope.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{row.id}</td>
                    <td>{row.dateTime}</td>
                    <td>{row.partyName}</td>
                    <td style={{ fontWeight: 600 }}>🚚 {row.vehicleNo}</td>
                    <td>{row.item}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.qty} {row.unit}</td>
                    <td>{row.purpose}</td>
                    <td>👮 {row.guard}</td>
                    <td>
                      <span className={`badge ${row.status === 'Closed' || row.status === 'Used' ? 'badge-active' : 'badge-pending'}`} style={{ borderRadius: '4px', fontSize: '11px' }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
