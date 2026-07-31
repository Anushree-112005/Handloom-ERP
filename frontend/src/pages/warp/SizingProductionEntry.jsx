import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Eye, Edit, X, Layers, Search, ArrowLeft, FileText } from 'lucide-react';
import { workOrderTransactionAPI } from '../../services/api';

const defaultHeader = {
  refNo: '1',
  prodType: '-',
  setDate: new Date().toISOString().substring(0, 10),
  warpingSetId: '-',
  sizingName: '-',
  sizingId: '',
  warpSetDate: new Date().toISOString().substring(0, 10),
  beamWidth: '',
  partyName: '-',
  machineNo: '',
  warpCount: '-',
  warpEnds: '',
  sizingSetNo: '',
  setId: '',
  warpingMtrs: '',
  millName: '-',
  designNo: '-',
  ibpoNo: '-',
  warper1Name: '',
  warper2Name: '',
  buyerName: '',
  warpingWaste: '',
  sizingWaste: '',
  sizingMeter: '',
  elongationPct: '',
  sizer1Name: '',
  sizer2Name: '',
  sizer3Name: '',
  sizer4Name: '',
  noOfSizedBeam: '',
  parallelBeam: 'NO',
  prgNoFrom: '',
  prgNoTo: ''
};

export default function SizingProductionEntry() {
  const navigate = useNavigate();

  // Navigation View State ('list' or 'form')
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Top header fields state
  const [header, setHeader] = useState(defaultHeader);

  // Sizing Particulars Table state
  const [particulars, setParticulars] = useState([
    { id: 1, prgNo: '-', beamNo: '', weaverBeamNo: '-', clothOutput: '-', grossWgt: '', tareWgt: '', netWgt: '', sizingMtr: '', beamType: '-', dly: '' }
  ]);

  const [newPart, setNewPart] = useState({ prgNo: '-', beamNo: '', weaverBeamNo: '-', clothOutput: '-', grossWgt: '', tareWgt: '', netWgt: '', sizingMtr: '', beamType: '-', dly: '' });
  const [sizingRemarks, setSizingRemarks] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await workOrderTransactionAPI.list();
      const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const filtered = data.filter(item => item.module_type === 'sizing_report');
      setItems(filtered);
    } catch (err) {
      console.error('Error fetching sizing entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const addParticularRow = () => {
    setParticulars([...particulars, { ...newPart, id: Date.now() }]);
    setNewPart({ prgNo: '-', beamNo: '', weaverBeamNo: '-', clothOutput: '-', grossWgt: '', tareWgt: '', netWgt: '', sizingMtr: '', beamType: '-', dly: '' });
  };

  const removeParticularRow = (id) => {
    setParticulars(particulars.filter(p => p.id !== id));
  };

  const handleNew = () => {
    setEditingId(null);
    setIsReadOnly(false);
    setHeader({ ...defaultHeader, refNo: String(items.length + 1) });
    setParticulars([{ id: 1, prgNo: '-', beamNo: '', weaverBeamNo: '-', clothOutput: '-', grossWgt: '', tareWgt: '', netWgt: '', sizingMtr: '', beamType: '-', dly: '' }]);
    setSizingRemarks('');
    setView('form');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setIsReadOnly(false);
    if (item.details?.header) setHeader({ ...defaultHeader, ...item.details.header });
    if (item.details?.particulars) setParticulars(item.details.particulars);
    if (item.details?.sizingRemarks !== undefined) setSizingRemarks(item.details.sizingRemarks);
    setView('form');
  };

  const handleView = (item) => {
    setEditingId(item.id);
    setIsReadOnly(true);
    if (item.details?.header) setHeader({ ...defaultHeader, ...item.details.header });
    if (item.details?.particulars) setParticulars(item.details.particulars);
    if (item.details?.sizingRemarks !== undefined) setSizingRemarks(item.details.sizingRemarks);
    setView('form');
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this sizing set entry?')) {
      try {
        await workOrderTransactionAPI.delete(id);
        fetchEntries();
      } catch (err) {
        console.error(err);
        alert('Failed to delete entry.');
      }
    }
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    const payload = {
      module_type: 'sizing_report',
      date: header.setDate,
      buyer_name: header.partyName || header.buyerName || 'Internal',
      status: 'Active',
      details: {
        header,
        particulars,
        sizingRemarks
      }
    };
    try {
      if (editingId) {
        await workOrderTransactionAPI.update(editingId, payload);
        alert('Sizing Production Entry updated successfully!');
      } else {
        await workOrderTransactionAPI.create(payload);
        alert('Sizing Production Entry saved successfully!');
      }
      setView('list');
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert('Failed to save Sizing Production Entry.');
    }
  };

  const totalNetWt = particulars.reduce((sum, p) => sum + (parseFloat(p.netWgt) || 0), 0);
  const totalSizingMtr = particulars.reduce((sum, p) => sum + (parseFloat(p.sizingMtr) || 0), 0);

  // Filtered items list
  const filteredItems = items.filter(item => {
    const h = item.details?.header || {};
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (h.refNo || item.transaction_no || '').toLowerCase().includes(query) ||
      (h.partyName || item.buyer_name || '').toLowerCase().includes(query) ||
      (h.sizingName || '').toLowerCase().includes(query) ||
      (h.sizingSetNo || '').toLowerCase().includes(query);

    const itemDate = item.date || h.setDate || '';
    const matchesFrom = !fromDate || itemDate >= fromDate;
    const matchesTo = !toDate || itemDate <= toDate;

    return matchesSearch && matchesFrom && matchesTo;
  });

  // --- RENDER LIST VIEW ---
  if (view === 'list') {
    return (
      <div className="animate-fade">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <Layers size={24} color="var(--primary)" /> Sizing Set Details Entry
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0 0' }}>
              Manage and track sizing production set details and beam allocations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNew}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> New Sizing Entry
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
              <Layers size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Sizing Entries</h3>
              <div className="value">{items.length}</div>
            </div>
          </div>

          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <FileText size={24} />
            </div>
            <div className="stat-details">
              <h3>Active Sets</h3>
              <div className="value">
                {items.filter(i => (i.status || 'Active') === 'Active').length}
              </div>
            </div>
          </div>

          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Layers size={24} />
            </div>
            <div className="stat-details">
              <h3>Parallel Beams</h3>
              <div className="value">
                {items.filter(i => i.details?.header?.parallelBeam === 'YES').length}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '14px 20px', background: 'var(--bg-secondary)', marginBottom: 24, border: 'none' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 36, fontSize: 13 }}
                placeholder="Search Ref No, Sizing Set No, Party..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>From:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 140, fontSize: 13 }}
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>To:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 140, fontSize: 13 }}
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading sizing entries...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No sizing set entries found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'left', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>REF NO / ID</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>SET DATE</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>PARTY / BUYER</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>SIZING MILL</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>WARP COUNT</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>SIZING MTRS</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>STATUS</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const h = item.details?.header || {};
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>
                          #{h.refNo || item.transaction_no || item.id}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{item.date || h.setDate || '-'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{h.partyName || item.buyer_name || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{h.sizingName || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{h.warpCount || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>{h.sizingMeter || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            {item.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px' }}
                              onClick={() => handleView(item)}
                              title="View Entry"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px' }}
                              onClick={() => handleEdit(item)}
                              title="Edit Entry"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', color: '#ef4444' }}
                              onClick={(e) => handleDelete(item.id, e)}
                              title="Delete Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER FORM VIEW ---
  return (
    <div className="animate-fade">
      {/* Top Header Title & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setView('list')}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isReadOnly ? 'View Sizing Set Details Entry' : editingId ? 'Edit Sizing Set Details Entry' : 'New Sizing Set Details Entry'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0 0' }}>
              Warping &rsaquo; Sizing Transaction &rsaquo; Sizing Set Entry Form
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <X size={16} /> Close Form
          </button>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="card" style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* Section 1: Set & Machine Details */}
        <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
          Set &amp; Machine Details
        </h4>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          
          <div className="form-group">
            <label>Ref No. *</label>
            <input type="text" className="form-control" name="refNo" value={header.refNo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Prod Type</label>
            <select className="form-control" name="prodType" value={header.prodType} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Prod Type -</option>
              <option value="Sizing">Sizing</option>
            </select>
          </div>

          <div className="form-group">
            <label>SET Date *</label>
            <input type="date" className="form-control" name="setDate" value={header.setDate} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warping Set ID</label>
            <select className="form-control" name="warpingSetId" value={header.warpingSetId} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Set ID -</option>
              <option value="WSET-101">WSET-101</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sizing Name</label>
            <select className="form-control" name="sizingName" value={header.sizingName} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">-- Select Sizing Mill --</option>
              <option value="VETRIVEL SIZING MILL">VETRIVEL SIZING MILL</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sizing ID</label>
            <input type="text" className="form-control" name="sizingId" value={header.sizingId} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warp Set Date</label>
            <input type="date" className="form-control" name="warpSetDate" value={header.warpSetDate} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Beam Width</label>
            <input type="text" className="form-control" name="beamWidth" value={header.beamWidth} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Party Name</label>
            <select className="form-control" name="partyName" value={header.partyName} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Party -</option>
              <option value="Raymond Ltd">Raymond Ltd</option>
            </select>
          </div>

          <div className="form-group">
            <label>Machine No</label>
            <input type="text" className="form-control" name="machineNo" value={header.machineNo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warp Count</label>
            <select className="form-control" name="warpCount" value={header.warpCount} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Count -</option>
              <option value="40s Cotton">40s Cotton</option>
            </select>
          </div>

          <div className="form-group">
            <label>Warp Ends</label>
            <input type="text" className="form-control" name="warpEnds" value={header.warpEnds} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizing Set No</label>
            <input type="text" className="form-control" name="sizingSetNo" value={header.sizingSetNo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>SET ID</label>
            <input type="text" className="form-control" name="setId" value={header.setId} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warping Mtrs</label>
            <input type="text" className="form-control" name="warpingMtrs" value={header.warpingMtrs} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Mill Name</label>
            <select className="form-control" name="millName" value={header.millName} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Mill -</option>
              <option value="Sri Raja Rajeshwari">Sri Raja Rajeshwari</option>
            </select>
          </div>

          <div className="form-group">
            <label>Design No.</label>
            <select className="form-control" name="designNo" value={header.designNo} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Design -</option>
              <option value="DES-4091">DES-4091</option>
            </select>
          </div>

          <div className="form-group">
            <label>IBPO No.</label>
            <select className="form-control" name="ibpoNo" value={header.ibpoNo} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select IBPO -</option>
              <option value="IBPO-1002">IBPO-1002</option>
            </select>
          </div>

          <div className="form-group">
            <label>Warper 1 Name</label>
            <input type="text" className="form-control" name="warper1Name" value={header.warper1Name} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warper 2 Name</label>
            <input type="text" className="form-control" name="warper2Name" value={header.warper2Name} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Buyer Name</label>
            <input type="text" className="form-control" name="buyerName" value={header.buyerName} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warping Waste</label>
            <input type="text" className="form-control" name="warpingWaste" value={header.warpingWaste} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizing Waste</label>
            <input type="text" className="form-control" name="sizingWaste" value={header.sizingWaste} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizing Meter</label>
            <input type="text" className="form-control" name="sizingMeter" value={header.sizingMeter} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Elongation %</label>
            <input type="text" className="form-control" name="elongationPct" value={header.elongationPct} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizer1 Name</label>
            <input type="text" className="form-control" name="sizer1Name" value={header.sizer1Name} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizer2 Name</label>
            <input type="text" className="form-control" name="sizer2Name" value={header.sizer2Name} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizer3 Name</label>
            <input type="text" className="form-control" name="sizer3Name" value={header.sizer3Name} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizer4 Name</label>
            <input type="text" className="form-control" name="sizer4Name" value={header.sizer4Name} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>No of Sized Beam</label>
            <input type="text" className="form-control" name="noOfSizedBeam" value={header.noOfSizedBeam} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Parallel Beam</label>
            <select className="form-control" name="parallelBeam" value={header.parallelBeam} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="NO">NO</option>
              <option value="YES">YES</option>
            </select>
          </div>

          <div className="form-group">
            <label>Prg No From</label>
            <input type="text" className="form-control" name="prgNoFrom" value={header.prgNoFrom} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Prg No To</label>
            <input type="text" className="form-control" name="prgNoTo" value={header.prgNoTo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

        </div>

        {/* Section 2: Sizing Particulars Table */}
        <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
          Sizing Particulars
        </h4>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', width: 50 }}>S.No</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Prg No</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Beam No</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Weaver Beam No</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Cloth Output</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Gross Wgt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Tare Wgt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Net Wgt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Sizing Mtr</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Beam Type</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Dly</th>
                {!isReadOnly && <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', width: 70 }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {/* Add New Row */}
              {!isReadOnly && (
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>-</td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.prgNo} onChange={e => setNewPart({...newPart, prgNo: e.target.value})}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.beamNo} onChange={e => setNewPart({...newPart, beamNo: e.target.value})} placeholder="Beam #" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.weaverBeamNo} onChange={e => setNewPart({...newPart, weaverBeamNo: e.target.value})}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.clothOutput} onChange={e => setNewPart({...newPart, clothOutput: e.target.value})}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.grossWgt} onChange={e => setNewPart({...newPart, grossWgt: e.target.value})} placeholder="Gross" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.tareWgt} onChange={e => setNewPart({...newPart, tareWgt: e.target.value})} placeholder="Tare" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.netWgt} onChange={e => setNewPart({...newPart, netWgt: e.target.value})} placeholder="Net" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.sizingMtr} onChange={e => setNewPart({...newPart, sizingMtr: e.target.value})} placeholder="Sizing Mtr" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.beamType} onChange={e => setNewPart({...newPart, beamType: e.target.value})}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.dly} onChange={e => setNewPart({...newPart, dly: e.target.value})} placeholder="Dly" />
                  </td>
                  <td style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                    <button type="button" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={addParticularRow}>
                      <Plus size={14} /> Add
                    </button>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {particulars.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>{idx + 1}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.prgNo}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.beamNo || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.weaverBeamNo}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.clothOutput}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.grossWgt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.tareWgt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.netWgt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.sizingMtr || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.beamType}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.dly || '-'}</td>
                  {!isReadOnly && (
                    <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                      <button type="button" onClick={() => removeParticularRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderTop: '2px solid var(--border)' }}>
            <div>Total Beams: {particulars.length} &nbsp;|&nbsp; Net Wt: {totalNetWt} &nbsp;|&nbsp; Sizing Mtrs: {totalSizingMtr}</div>
            <div>Arrived Gms: 0.00</div>
          </div>
        </div>

        {/* Section 3: Remarks */}
        <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
          Sizing Remarks
        </h4>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Remarks</label>
          <input type="text" className="form-control" value={sizingRemarks} onChange={e => setSizingRemarks(e.target.value)} placeholder="Enter sizing notes / remarks" disabled={isReadOnly} />
        </div>

        {/* Action Buttons Footer Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          {!isReadOnly && (
            <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={16} /> Save Entry
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <X size={16} /> Exit to List
          </button>
        </div>

      </div>
    </div>
  );
}
