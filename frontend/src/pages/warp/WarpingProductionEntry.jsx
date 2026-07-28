import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Eye, Edit, X, Layers, Search, ArrowLeft, FileText } from 'lucide-react';
import { workOrderTransactionAPI } from '../../services/api';

const defaultHeader = {
  refNo: '1',
  prodType: '-',
  orderType: '-',
  setDate: new Date().toISOString().substring(0, 10),
  sizingName: '',
  sizingId: '',
  machineNo: '',
  partyName: '',
  beamWidth: '',
  warpCount: '-',
  warpSetNo: '',
  warpSetId: '',
  millName: '-',
  lotNo: '',
  against: '-',
  warpEnds: '',
  yarnRate: '',
  yarnGst: '',
  designNo: '-',
  ibpoNo: '-',
  warpingMtrs: '',
  calcGmsMtr: '',
  buyerName: '',
  warper1Name: '',
  warper2Name: '',
  beamType: '-'
};

export default function WarpingProductionEntry() {
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

  // Particulars Table state
  const [particulars, setParticulars] = useState([
    { id: 1, beamNo: '', yarnCount: '-', ends: '', colour: '-', warpMtr: '', netWt: '', tareWt: '', grsWt: '', breakage: '' }
  ]);
  const [newPart, setNewPart] = useState({ beamNo: '', yarnCount: '-', ends: '', colour: '-', warpMtr: '', netWt: '', tareWt: '', grsWt: '', breakage: '' });

  // Yarn Taken Detail Table state
  const [yarnTaken, setYarnTaken] = useState([
    { id: 1, yarnCount: '-', colour: '-', takenKgs: '', consumedKgs: '', balnKgs: '', fullConeWgt: '', babyConeWgt: '', shortExcess: '', totalKgs: '' }
  ]);
  const [newYarn, setNewYarn] = useState({ yarnCount: '-', colour: '-', takenKgs: '', consumedKgs: '', balnKgs: '', fullConeWgt: '', babyConeWgt: '', shortExcess: '', totalKgs: '' });

  // Bottom Summary fields
  const [summary, setSummary] = useState({
    yarnTakenKgs: '',
    consumedKgs: '',
    rewinding: '',
    fullConeWt: '',
    babyCone: '',
    exSh: '',
    beamCount: '',
    grmsPerMtr: '',
    cutConeLoss: '',
    warpWaste: '',
    sizingWaste: '',
    palletBagNos: '',
    warpingRemarks: ''
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await workOrderTransactionAPI.list();
      const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const filtered = data.filter(item => item.module_type === 'warping_report');
      setItems(filtered);
    } catch (err) {
      console.error('Error fetching warping entries:', err);
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

  const handleSummaryChange = (e) => {
    setSummary({ ...summary, [e.target.name]: e.target.value });
  };

  const addParticularRow = () => {
    setParticulars([...particulars, { ...newPart, id: Date.now() }]);
    setNewPart({ beamNo: '', yarnCount: '-', ends: '', colour: '-', warpMtr: '', netWt: '', tareWt: '', grsWt: '', breakage: '' });
  };

  const removeParticularRow = (id) => {
    setParticulars(particulars.filter(p => p.id !== id));
  };

  const addYarnRow = () => {
    setYarnTaken([...yarnTaken, { ...newYarn, id: Date.now() }]);
    setNewYarn({ yarnCount: '-', colour: '-', takenKgs: '', consumedKgs: '', balnKgs: '', fullConeWgt: '', babyConeWgt: '', shortExcess: '', totalKgs: '' });
  };

  const removeYarnRow = (id) => {
    setYarnTaken(yarnTaken.filter(y => y.id !== id));
  };

  const handleNew = () => {
    setEditingId(null);
    setIsReadOnly(false);
    setHeader({ ...defaultHeader, refNo: String(items.length + 1) });
    setParticulars([{ id: 1, beamNo: '', yarnCount: '-', ends: '', colour: '-', warpMtr: '', netWt: '', tareWt: '', grsWt: '', breakage: '' }]);
    setYarnTaken([{ id: 1, yarnCount: '-', colour: '-', takenKgs: '', consumedKgs: '', balnKgs: '', fullConeWgt: '', babyConeWgt: '', shortExcess: '', totalKgs: '' }]);
    setSummary({ yarnTakenKgs: '', consumedKgs: '', rewinding: '', fullConeWt: '', babyCone: '', exSh: '', beamCount: '', grmsPerMtr: '', cutConeLoss: '', warpWaste: '', sizingWaste: '', palletBagNos: '', warpingRemarks: '' });
    setView('form');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setIsReadOnly(false);
    if (item.details?.header) setHeader({ ...defaultHeader, ...item.details.header });
    if (item.details?.particulars) setParticulars(item.details.particulars);
    if (item.details?.yarnTaken) setYarnTaken(item.details.yarnTaken);
    if (item.details?.summary) setSummary(item.details.summary);
    setView('form');
  };

  const handleView = (item) => {
    setEditingId(item.id);
    setIsReadOnly(true);
    if (item.details?.header) setHeader({ ...defaultHeader, ...item.details.header });
    if (item.details?.particulars) setParticulars(item.details.particulars);
    if (item.details?.yarnTaken) setYarnTaken(item.details.yarnTaken);
    if (item.details?.summary) setSummary(item.details.summary);
    setView('form');
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this warping set entry?')) {
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
      module_type: 'warping_report',
      date: header.setDate,
      buyer_name: header.partyName || header.buyerName || 'Internal',
      status: 'Active',
      details: {
        header,
        particulars,
        yarnTaken,
        summary
      }
    };
    try {
      if (editingId) {
        await workOrderTransactionAPI.update(editingId, payload);
        alert('Warping Production SET Entry updated successfully!');
      } else {
        await workOrderTransactionAPI.create(payload);
        alert('Warping Production SET Entry saved successfully!');
      }
      setView('list');
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert('Failed to save Warping Production Entry.');
    }
  };

  // Totals calculation
  const totalWarpMtr = particulars.reduce((sum, p) => sum + (parseFloat(p.warpMtr) || 0), 0);
  const totalNetWt = particulars.reduce((sum, p) => sum + (parseFloat(p.netWt) || 0), 0);
  const totalGrsWt = particulars.reduce((sum, p) => sum + (parseFloat(p.grsWt) || 0), 0);
  const totalBreakage = particulars.reduce((sum, p) => sum + (parseFloat(p.breakage) || 0), 0);

  // Filtered items list
  const filteredItems = items.filter(item => {
    const h = item.details?.header || {};
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (h.refNo || item.transaction_no || '').toLowerCase().includes(query) ||
      (h.partyName || item.buyer_name || '').toLowerCase().includes(query) ||
      (h.sizingName || '').toLowerCase().includes(query) ||
      (h.warpSetNo || '').toLowerCase().includes(query);

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
              <Layers size={24} color="var(--primary)" /> Warping SET Entry
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0 0' }}>
              Manage and track warping production set entries.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNew}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> New Warping Entry
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Layers size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Entries</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{items.length}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Job Work Entries</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {items.filter(i => (i.details?.header?.orderType || '').includes('Job')).length}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Layers size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Own Production</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {items.filter(i => (i.details?.header?.orderType || '').includes('Own')).length}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '14px 20px', background: '#fff', borderRadius: 8, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 36, fontSize: 13 }}
                placeholder="Search DC No, Ref No, Party..."
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
        <div className="card" style={{ padding: 0, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading warping entries...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No warping set entries found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'left', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>REF NO / ID</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>DATE</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>PARTY / BUYER</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>SIZING MILL</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>WARP COUNT</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>WARP MTRS</th>
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
                        <td style={{ padding: '12px 16px' }}>{h.warpingMtrs || '-'}</td>
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
              {isReadOnly ? 'View Warping SET Entry' : editingId ? 'Edit Warping SET Entry' : 'New Warping SET Entry'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0 0' }}>
              Warping &rsaquo; Sizing Transaction &rsaquo; Set Entry Form
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
        
        {/* Section 1: Set Details */}
        <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
          Basic &amp; Set Information
        </h4>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          
          <div className="form-group">
            <label>Ref No *</label>
            <input type="text" className="form-control" name="refNo" value={header.refNo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Prod Type</label>
            <select className="form-control" name="prodType" value={header.prodType} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Prod Type -</option>
              <option value="Sizing">Sizing</option>
              <option value="Direct">Direct</option>
            </select>
          </div>

          <div className="form-group">
            <label>Order Type</label>
            <select className="form-control" name="orderType" value={header.orderType} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Order Type -</option>
              <option value="Job Work">Job Work</option>
              <option value="Own Production">Own Production</option>
            </select>
          </div>

          <div className="form-group">
            <label>Set Date *</label>
            <input type="date" className="form-control" name="setDate" value={header.setDate} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Sizing Name</label>
            <select className="form-control" name="sizingName" value={header.sizingName} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="">-- Select Sizing Mill --</option>
              <option value="VETRIVEL SIZING MILL">VETRIVEL SIZING MILL</option>
              <option value="DINESH SIZING UNIT">DINESH SIZING UNIT</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sizing ID</label>
            <input type="text" className="form-control" name="sizingId" value={header.sizingId} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Machine No</label>
            <input type="text" className="form-control" name="machineNo" value={header.machineNo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Party Name</label>
            <input type="text" className="form-control" name="partyName" value={header.partyName} onChange={handleHeaderChange} placeholder="Party / Mill Name" disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Beam Width</label>
            <input type="text" className="form-control" name="beamWidth" value={header.beamWidth} onChange={handleHeaderChange} placeholder="e.g. 72 inch" disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warp Count</label>
            <select className="form-control" name="warpCount" value={header.warpCount} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Count -</option>
              <option value="40s Cotton">40s Cotton</option>
              <option value="60s Combed">60s Combed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Warp Set No.</label>
            <input type="text" className="form-control" name="warpSetNo" value={header.warpSetNo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warp Set ID</label>
            <input type="text" className="form-control" name="warpSetId" value={header.warpSetId} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Mill Name</label>
            <select className="form-control" name="millName" value={header.millName} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Mill -</option>
              <option value="Sri Raja Rajeshwari">Sri Raja Rajeshwari</option>
            </select>
          </div>

          <div className="form-group">
            <label>Lot No</label>
            <input type="text" className="form-control" name="lotNo" value={header.lotNo} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Against</label>
            <select className="form-control" name="against" value={header.against} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select -</option>
              <option value="Order">Order</option>
              <option value="Stock">Stock</option>
            </select>
          </div>

          <div className="form-group">
            <label>Warp Ends</label>
            <input type="text" className="form-control" name="warpEnds" value={header.warpEnds} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Yarn Rate</label>
            <input type="text" className="form-control" name="yarnRate" value={header.yarnRate} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Yarn GST</label>
            <input type="text" className="form-control" name="yarnGst" value={header.yarnGst} onChange={handleHeaderChange} disabled={isReadOnly} />
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
            <label>Warping Mtrs</label>
            <input type="text" className="form-control" name="warpingMtrs" value={header.warpingMtrs} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Calc Gms/Mtr</label>
            <input type="text" className="form-control" name="calcGmsMtr" value={header.calcGmsMtr} onChange={handleHeaderChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Buyer Name</label>
            <input type="text" className="form-control" name="buyerName" value={header.buyerName} onChange={handleHeaderChange} disabled={isReadOnly} />
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
            <label>Beam Type</label>
            <select className="form-control" name="beamType" value={header.beamType} onChange={handleHeaderChange} disabled={isReadOnly}>
              <option value="-">- Select Beam Type -</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
            </select>
          </div>

        </div>

        {/* Section 2: Warping Particulars */}
        <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
          Warping Particulars
        </h4>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', width: 50 }}>S.No</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Beam No</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Yarn Count</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Ends</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Colour</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Warp Mtr</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Net Wt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Tare Wt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Grs Wt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Breakage</th>
                {!isReadOnly && <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', width: 70 }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {/* Add New Row */}
              {!isReadOnly && (
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>-</td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.beamNo} onChange={e => setNewPart({...newPart, beamNo: e.target.value})} placeholder="Beam #" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.yarnCount} onChange={e => setNewPart({...newPart, yarnCount: e.target.value})}>
                      <option value="-">-</option>
                      <option value="40s">40s</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.ends} onChange={e => setNewPart({...newPart, ends: e.target.value})} placeholder="Ends" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.colour} onChange={e => setNewPart({...newPart, colour: e.target.value})}>
                      <option value="-">-</option>
                      <option value="White">White</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.warpMtr} onChange={e => setNewPart({...newPart, warpMtr: e.target.value})} placeholder="Mtr" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.netWt} onChange={e => setNewPart({...newPart, netWt: e.target.value})} placeholder="Net Wt" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.tareWt} onChange={e => setNewPart({...newPart, tareWt: e.target.value})} placeholder="Tare Wt" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.grsWt} onChange={e => setNewPart({...newPart, grsWt: e.target.value})} placeholder="Grs Wt" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newPart.breakage} onChange={e => setNewPart({...newPart, breakage: e.target.value})} placeholder="Breakage" />
                  </td>
                  <td style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                    <button type="button" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={addParticularRow}>
                      <Plus size={14} /> Add
                    </button>
                  </td>
                </tr>
              )}

              {/* Table Data Rows */}
              {particulars.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>{idx + 1}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.beamNo || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.yarnCount}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.ends || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.colour}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.warpMtr || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.netWt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.tareWt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.grsWt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.breakage || '-'}</td>
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
            <div>Total: {particulars.length} Beams &nbsp;|&nbsp; Mtrs: {totalWarpMtr} &nbsp;|&nbsp; Grs Wt: {totalGrsWt}</div>
            <div>Tot Breakage %: {totalBreakage}%</div>
          </div>
        </div>

        {/* Section 3: Yarn Taken Detail */}
        <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
          Yarn Taken Detail
        </h4>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8 }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', width: 50 }}>S.No</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Yarn Count</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Colour</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Taken Kgs</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Consumed Kgs</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Baln. Kgs</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Full Cone Wgt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Baby Cone Wgt</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Short/Excess</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>Total Kgs</th>
                {!isReadOnly && <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', width: 70 }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {/* Add New Yarn Row */}
              {!isReadOnly && (
                <tr style={{ background: 'var(--bg-primary)' }}>
                  <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>-</td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.yarnCount} onChange={e => setNewYarn({...newYarn, yarnCount: e.target.value})}>
                      <option value="-">-</option>
                      <option value="40s">40s</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <select className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.colour} onChange={e => setNewYarn({...newYarn, colour: e.target.value})}>
                      <option value="-">-</option>
                      <option value="White">White</option>
                    </select>
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.takenKgs} onChange={e => setNewYarn({...newYarn, takenKgs: e.target.value})} placeholder="Taken" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.consumedKgs} onChange={e => setNewYarn({...newYarn, consumedKgs: e.target.value})} placeholder="Consumed" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.balnKgs} onChange={e => setNewYarn({...newYarn, balnKgs: e.target.value})} placeholder="Baln" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.fullConeWgt} onChange={e => setNewYarn({...newYarn, fullConeWgt: e.target.value})} placeholder="Full Cone" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.babyConeWgt} onChange={e => setNewYarn({...newYarn, babyConeWgt: e.target.value})} placeholder="Baby Cone" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.shortExcess} onChange={e => setNewYarn({...newYarn, shortExcess: e.target.value})} placeholder="+/-" />
                  </td>
                  <td style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
                    <input type="text" className="form-control" style={{ padding: '4px 8px', fontSize: 12 }} value={newYarn.totalKgs} onChange={e => setNewYarn({...newYarn, totalKgs: e.target.value})} placeholder="Total Kgs" />
                  </td>
                  <td style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                    <button type="button" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={addYarnRow}>
                      <Plus size={14} /> Add
                    </button>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {yarnTaken.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>{idx + 1}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.yarnCount}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.colour}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.takenKgs || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.consumedKgs || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.balnKgs || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.fullConeWgt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.babyConeWgt || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.shortExcess || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>{row.totalKgs || '-'}</td>
                  {!isReadOnly && (
                    <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                      <button type="button" onClick={() => removeYarnRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Production Summary & Remarks */}
        <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
          Production Summary &amp; Remarks
        </h4>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          
          <div className="form-group">
            <label>Yarn Taken Kgs</label>
            <input type="text" className="form-control" name="yarnTakenKgs" value={summary.yarnTakenKgs} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Consumed Kgs</label>
            <input type="text" className="form-control" name="consumedKgs" value={summary.consumedKgs} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Rewinding</label>
            <input type="text" className="form-control" name="rewinding" value={summary.rewinding} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Full Cone Wt</label>
            <input type="text" className="form-control" name="fullConeWt" value={summary.fullConeWt} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Baby Cone</label>
            <input type="text" className="form-control" name="babyCone" value={summary.babyCone} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Ex / Sh</label>
            <input type="text" className="form-control" name="exSh" value={summary.exSh} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Beam Count</label>
            <input type="text" className="form-control" name="beamCount" value={summary.beamCount} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Grms per Mtr</label>
            <input type="text" className="form-control" name="grmsPerMtr" value={summary.grmsPerMtr} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>CutCone Loss (Rs.)</label>
            <input type="text" className="form-control" name="cutConeLoss" value={summary.cutConeLoss} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group">
            <label>Warp Waste</label>
            <input type="text" className="form-control" name="warpWaste" value={summary.warpWaste} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Sizing Waste</label>
            <input type="text" className="form-control" name="sizingWaste" value={summary.sizingWaste} onChange={handleSummaryChange} disabled={isReadOnly} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 4' }}>
            <label>Pallet / Bag Nos.</label>
            <input type="text" className="form-control" name="palletBagNos" value={summary.palletBagNos} onChange={handleSummaryChange} placeholder="Enter pallet or bag numbers" disabled={isReadOnly} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 4' }}>
            <label>Warping Remarks</label>
            <input type="text" className="form-control" name="warpingRemarks" value={summary.warpingRemarks} onChange={handleSummaryChange} placeholder="Enter warping notes / remarks" disabled={isReadOnly} />
          </div>

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
