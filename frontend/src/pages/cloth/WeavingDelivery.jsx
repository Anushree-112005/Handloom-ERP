import { useState, useEffect, useMemo } from 'react';
import { Truck, Plus, Search, Eye, Trash2, Save, X, Edit2, FileText, Database, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import A4DocumentPreview from '../../components/A4DocumentPreview';

export default function WeavingDelivery() {
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('dt_weaving_delivery_records');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('dt_weaving_delivery_records', JSON.stringify(records));
  }, [records]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewModalDelivery, setViewModalDelivery] = useState(null);

  const initialForm = {
    id: '',
    date: new Date().toISOString().substring(0, 10),
    loomNo: '',
    beamNo: '',
    operator: '',
    width: '',
    length: '',
    weight: '',
    status: 'Pending',
    remarks: ''
  };

  const [form, setForm] = useState(initialForm);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.loomNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.beamNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (editingId) {
      setRecords(prev => prev.map(r => r.id === editingId ? { ...form, id: editingId } : r));
    } else {
      const newId = `WD-00000${records.length + 1}`;
      setRecords(prev => [...prev, { ...form, id: newId }]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleEdit = (r) => {
    setForm(r);
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm(`Remove weaving delivery voucher ${id}?`)) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weaving Delivery');
    XLSX.writeFile(wb, `Weaving_Delivery_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={24} color="var(--primary)" /> Weaving Delivery (Beam Issue)
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage sized beam deliveries and issues to specific loom configurations.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} /> Excel
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> New Delivery
          </button>
        </div>
      </div>

      {!showForm ? (
        <>
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search Loom, Beam or Voucher..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Voucher ID</th>
                  <th>Date</th>
                  <th>Loom Allocation</th>
                  <th>Beam Number</th>
                  <th>Loom Operator</th>
                  <th style={{ textAlign: 'right' }}>Beam Width</th>
                  <th style={{ textAlign: 'right' }}>Warp Length</th>
                  <th style={{ textAlign: 'right' }}>Weight (Kg)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.id}</td>
                    <td>{r.date}</td>
                    <td style={{ fontWeight: 600 }}>{r.loomNo}</td>
                    <td>{r.beamNo}</td>
                    <td>{r.operator}</td>
                    <td style={{ textAlign: 'right' }}>{r.width}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.length} Mtr</td>
                    <td style={{ textAlign: 'right' }}>{r.weight} Kg</td>
                    <td>
                      <span className={`badge ${r.status === 'Completed' ? 'badge-active' : r.status === 'In-Process' ? 'badge-pending' : 'badge-draft'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => setViewModalDelivery(r)}
                          title="Preview Delivery"
                        >
                          <Eye size={16} color="var(--primary)" />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(r)} title="Edit"><Edit2 size={12} /></button>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(r.id)} title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={handleCreate} className="card animate-slide">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{editingId ? 'Edit Delivery Voucher' : 'Log Beam Issue / Weaving Delivery'}</h3>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ padding: '6px 12px' }}><X size={16} /></button>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div className="form-group">
              <label>Delivery Date</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Loom Selection / Godown</label>
              <input type="text" className="form-control" placeholder="e.g. Loom-12" value={form.loomNo} onChange={e => setForm({ ...form, loomNo: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Beam Number</label>
              <input type="text" className="form-control" placeholder="e.g. B-891" value={form.beamNo} onChange={e => setForm({ ...form, beamNo: e.target.value })} required />
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 12 }}>
            <div className="form-group">
              <label>Loom Operator</label>
              <input type="text" className="form-control" placeholder="Operator Name" value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Beam Width</label>
              <input type="text" className="form-control" placeholder="e.g. 2200 mm" value={form.width} onChange={e => setForm({ ...form, width: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Warp Length (Mtr)</label>
              <input type="number" className="form-control" placeholder="Meters" value={form.length} onChange={e => setForm({ ...form, length: parseFloat(e.target.value) })} required />
            </div>
            <div className="form-group">
              <label>Gross Weight (Kg)</label>
              <input type="number" className="form-control" placeholder="Kg" value={form.weight} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) })} required />
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 12 }}>
            <div className="form-group">
              <label>Voucher Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="In-Process">In-Process</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Remarks / Technical Notes</label>
              <input type="text" className="form-control" placeholder="Weave specifications..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }}><Save size={16} /> Save Delivery Voucher</button>
          </div>
        </form>
      )}

      <A4DocumentPreview
        isOpen={!!viewModalDelivery}
        onClose={() => setViewModalDelivery(null)}
        title="WEAVING DELIVERY (BEAM ISSUE)"
        documentNumber={viewModalDelivery?.id}
        status={viewModalDelivery?.status}
        onDownloadPdf={() => alert('PDF Export functionality to be implemented')}
        sections={viewModalDelivery ? [
          {
            title: "VOUCHER DETAILS",
            icon: "FileText",
            type: "grid",
            data: [
              { label: "Voucher ID", value: viewModalDelivery.id },
              { label: "Date", value: viewModalDelivery.date },
              { label: "Loom Allocation", value: viewModalDelivery.loomNo },
              { label: "Loom Operator", value: viewModalDelivery.operator }
            ]
          },
          {
            title: "BEAM & WARP SPECIFICATIONS",
            icon: "Settings",
            type: "grid",
            data: [
              { label: "Beam Number", value: viewModalDelivery.beamNo },
              { label: "Beam Width", value: viewModalDelivery.width },
              { label: "Warp Length", value: `${viewModalDelivery.length} Mtr` },
              { label: "Gross Weight", value: `${viewModalDelivery.weight} Kg` }
            ]
          },
          {
            title: "ADDITIONAL INFO",
            icon: "Database",
            type: "grid",
            data: [
              { label: "Remarks", value: viewModalDelivery.remarks || '-' }
            ]
          }
        ] : []}
      />
    </div>
  );
}
