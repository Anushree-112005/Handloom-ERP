import { useState, useMemo } from 'react';
import { 
  Shield, Search, Plus, Filter, FileText, Printer, Check, 
  Clock, Truck, Key, Eye, Trash2, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

export default function GateTransaction() {
  // Mock gate transactions database
  const [transactions, setTransactions] = useState([
    { id: 'GT-2026-001', passNo: 'GP-9011', vehicleNo: 'TN-37-BY-1204', type: 'Inward', party: 'Vardhman Spinning', material: 'Cotton Yarn Combed 40s', qty: '40 Bags', driverName: 'Ramesh Kumar', inTime: '2026-06-01 09:30', outTime: '2026-06-01 11:15', weightTare: 3400, weightGross: 6200, weightNet: 2800, status: 'Completed', remarks: 'Gate entry verified' },
    { id: 'GT-2026-002', passNo: 'GP-9012', vehicleNo: 'KA-01-MH-5566', type: 'Outward', party: 'Reliance Retail', material: 'Finished Cotton Satin', qty: '84 Rolls', driverName: 'Sanjay Singh', inTime: '2026-06-01 10:15', outTime: '', weightTare: 3200, weightGross: 5800, weightNet: 2600, status: 'Checked In', remarks: 'Loading in progress' },
    { id: 'GT-2026-003', passNo: 'GP-9013', vehicleNo: 'MH-12-PQ-9988', type: 'Inward', party: 'Chemical Traders', material: 'Sizing Chemical Starch', qty: '120 Drums', driverName: 'Anil Patel', inTime: '2026-06-01 12:45', outTime: '', weightTare: 4100, weightGross: 9300, weightNet: 5200, status: 'Checked In', remarks: 'Unloading initiated' },
    { id: 'GT-2026-004', passNo: 'GP-9014', vehicleNo: 'TN-30-AA-8877', type: 'Outward', party: 'Raymond Ltd', material: 'Grey Fabric Weave 120gsm', qty: '110 Rolls', driverName: 'M. Selvam', inTime: '2026-05-31 14:00', outTime: '2026-05-31 16:30', weightTare: 3500, weightGross: 7800, weightNet: 4300, status: 'Completed', remarks: 'Dispatch cleared' }
  ]);

  // Form State
  const [selectedId, setSelectedId] = useState(transactions[0].id);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Active form values
  const [passNo, setPassNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [type, setType] = useState('Inward');
  const [party, setParty] = useState('');
  const [material, setMaterial] = useState('');
  const [qty, setQty] = useState('');
  const [driverName, setDriverName] = useState('');
  const [weightTare, setWeightTare] = useState(0);
  const [weightGross, setWeightGross] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Checked In');

  // Currently viewed transaction
  const activeTx = useMemo(() => {
    return transactions.find(t => t.id === selectedId) || null;
  }, [transactions, selectedId]);

  // Filtered transactions list
  const filteredList = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.passNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'All' || t.type === filterType;
      return matchSearch && matchType;
    });
  }, [transactions, searchTerm, filterType]);

  const handleSelectTx = (tx) => {
    setSelectedId(tx.id);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const nextId = `GT-2026-00${transactions.length + 1}`;
    const nextPass = `GP-${9011 + transactions.length}`;
    setSelectedId(nextId);
    setIsEditing(true);

    // Reset Form Fields
    setPassNo(nextPass);
    setVehicleNo('');
    setType('Inward');
    setParty('');
    setMaterial('');
    setQty('');
    setDriverName('');
    setWeightTare(0);
    setWeightGross(0);
    setRemarks('');
    setStatus('Checked In');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!vehicleNo || !party || !material) {
      alert("Please fill in Vehicle No, Party, and Material details!");
      return;
    }

    const netWeight = Math.max(0, weightGross - weightTare);
    const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const isExisting = transactions.some(t => t.id === selectedId);

    if (isExisting) {
      // Update
      setTransactions(transactions.map(t => {
        if (t.id === selectedId) {
          return {
            ...t,
            vehicleNo,
            type,
            party,
            material,
            qty,
            driverName,
            weightTare: Number(weightTare),
            weightGross: Number(weightGross),
            weightNet: netWeight,
            remarks,
            status,
            outTime: status === 'Completed' ? timeNow : t.outTime
          };
        }
        return t;
      }));
    } else {
      // Insert
      const newEntry = {
        id: selectedId,
        passNo,
        vehicleNo,
        type,
        party,
        material,
        qty,
        driverName,
        weightTare: Number(weightTare),
        weightGross: Number(weightGross),
        weightNet: netWeight,
        inTime: timeNow,
        outTime: status === 'Completed' ? timeNow : '',
        status,
        remarks
      };
      setTransactions([newEntry, ...transactions]);
    }
    setIsEditing(false);
    alert("Gate transaction saved successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this gate record?")) {
      const remaining = transactions.filter(t => t.id !== id);
      setTransactions(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
    }
  };

  const handleCheckOut = (id) => {
    const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Completed', outTime: timeNow };
      }
      return t;
    }));
    alert("Vehicle logged out and Gate Pass closed!");
  };

  const handleStartEdit = () => {
    if (!activeTx) return;
    setPassNo(activeTx.passNo);
    setVehicleNo(activeTx.vehicleNo);
    setType(activeTx.type);
    setParty(activeTx.party);
    setMaterial(activeTx.material);
    setQty(activeTx.qty);
    setDriverName(activeTx.driverName);
    setWeightTare(activeTx.weightTare);
    setWeightGross(activeTx.weightGross);
    setRemarks(activeTx.remarks);
    setStatus(activeTx.status);
    setIsEditing(true);
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Shield size={26} style={{ color: '#4f46e5' }} /> Gate & Security Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            Real-time tracking of security checkposts, vehicle logs, and gate clearance passes
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700 }}>
          <Plus size={18} /> New Gate Inward / Outward
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: VEHICLE LIST */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          
          {/* List Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search Vehicle No, Pass, Party..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', margin: 0, fontSize: '13px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Inward', 'Outward'].map(tab => (
                <button
                  key={tab}
                  className={`btn ${filterType === tab ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '12px', justifyContent: 'center' }}
                  onClick={() => setFilterType(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List Scrolling area */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '550px' }}>
            {filteredList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active gate entries found.
              </div>
            ) : (
              filteredList.map(tx => {
                const isSelected = tx.id === selectedId;
                return (
                  <div
                    key={tx.id}
                    onClick={() => handleSelectTx(tx)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                      borderLeft: isSelected ? '4px solid #4f46e5' : '4px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {tx.vehicleNo}
                      </span>
                      <span className={`badge ${tx.type === 'Inward' ? 'badge-active' : 'badge-pending'}`} style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '2px 8px', fontSize: '11px' }}>
                        {tx.type === 'Inward' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                        {tx.type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span>Pass: <strong>{tx.passNo}</strong></span>
                      <span>{tx.party}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {tx.inTime.split(' ')[1]}
                      </span>
                      <span className={`badge ${tx.status === 'Completed' ? 'badge-active' : 'badge-draft'}`} style={{ fontSize: '11px', borderRadius: '4px' }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL PANEL OR FORM */}
        <div className="card" style={{ padding: '28px', minHeight: '600px' }}>
          
          {isEditing ? (
            /* ================= EDITING / CREATING FORM ================= */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeTx && transactions.some(t => t.id === selectedId) ? `Edit Gate Pass ${passNo}` : `New Inward / Outward Entry`}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                    Save & Print Slip
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div className="form-group">
                  <label>Gate Pass Number</label>
                  <input type="text" className="form-control" value={passNo} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                </div>

                <div className="form-group">
                  <label>Vehicle Register Number *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. TN-37-AA-9900" 
                    value={vehicleNo} 
                    onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Transaction Direction</label>
                  <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Inward">Inward (Incoming Goods/Vehicle)</option>
                    <option value="Outward">Outward (Outgoing Dispatch/Empty)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Party / Vendor Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Vardhman Spinning Mills" 
                    value={party} 
                    onChange={e => setParty(e.target.value)} 
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Driver Name / Lic No</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Driver full name" 
                    value={driverName} 
                    onChange={e => setDriverName(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Qty & Packages</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 80 Poly Bags / 40 Rolls" 
                    value={qty} 
                    onChange={e => setQty(e.target.value)} 
                  />
                </div>

              </div>

              <div className="form-group">
                <label>Material Details / Description *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 40s Cotton Weft Combed Cones" 
                  value={material} 
                  onChange={e => setMaterial(e.target.value)} 
                  required
                />
              </div>

              {/* Weight Details */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={14} /> Weigh Bridge Integrator (Kgs)
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px' }}>Tare Weight (Empty)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={weightTare} 
                      onChange={e => setWeightTare(Number(e.target.value))} 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px' }}>Gross Weight (Loaded)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={weightGross} 
                      onChange={e => setWeightGross(Number(e.target.value))} 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Net Material Wt</label>
                    <div className="form-control" style={{ background: 'white', display: 'flex', alignItems: 'center', fontWeight: 800, color: '#4f46e5' }}>
                      {Math.max(0, weightGross - weightTare).toLocaleString()} Kgs
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Remarks / Notes</label>
                  <input type="text" className="form-control" placeholder="Security remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Verification Status</label>
                  <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Checked In">Checked In (Loading/Unloading)</option>
                    <option value="Completed">Completed (Logged Out)</option>
                  </select>
                </div>
              </div>

            </form>
          ) : (
            /* ================= COMPONENT VIEW DETAIL PANEL ================= */
            activeTx ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Panel Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div>
                    <span className="badge badge-active" style={{ fontSize: '11px', marginBottom: '4px', letterSpacing: '0.5px' }}>
                      SYSTEM ENTRY ID: {activeTx.id}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: 850, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Gate Pass — {activeTx.passNo}
                    </h3>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={handleStartEdit}>
                      Edit Details
                    </button>
                    {activeTx.status !== 'Completed' && (
                      <button className="btn btn-success" onClick={() => handleCheckOut(activeTx.id)} style={{ background: '#10b981', color: 'white', border: 'none', fontWeight: 700 }}>
                        <Check size={14} /> Log Exit / Check Out
                      </button>
                    )}
                    <button className="btn btn-secondary" title="Print Slip Layout" onClick={() => alert("Printing Gate Entry Pass ticket...")}>
                      <Printer size={14} /> Print
                    </button>
                    <button className="btn btn-secondary" title="Delete" onClick={() => handleDelete(activeTx.id)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Detail Information Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Direction type</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '15px', color: activeTx.type === 'Inward' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeTx.type === 'Inward' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      {activeTx.type} Entry
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Register No</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                      🚚 {activeTx.vehicleNo}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Party / Client Name</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {activeTx.party}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Driver / Operator</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                      👤 {activeTx.driverName || 'N/A'}
                    </p>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Material & Volume</span>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#4f46e5', fontSize: '15px' }}>
                      📦 {activeTx.material} ({activeTx.qty || 'N/A'})
                    </p>
                  </div>

                </div>

                {/* Weighbridge summary */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 16px 0', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} style={{ color: '#4f46e5' }} /> Weighbridge Weight Log
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tare Wt (Empty)</span>
                      <h5 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
                        {activeTx.weightTare.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500 }}>Kgs</span>
                      </h5>
                    </div>
                    
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gross Wt (Loaded)</span>
                      <h5 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
                        {activeTx.weightGross.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500 }}>Kgs</span>
                      </h5>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 700 }}>Net Material Wt</span>
                      <h5 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0 0', color: '#4f46e5' }}>
                        {activeTx.weightNet.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600 }}>Kgs</span>
                      </h5>
                    </div>
                  </div>
                </div>

                {/* Logistics Timestamps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>IN TIME</span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{activeTx.inTime}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTx.outTime ? '#3b82f6' : 'var(--text-muted)' }} />
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>OUT TIME</span>
                      <strong style={{ fontSize: '13px', color: activeTx.outTime ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {activeTx.outTime || 'Pending Exit'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Remarks Section */}
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Security Remarks</span>
                  <p style={{ margin: '4px 0 0 0', background: 'rgba(79, 70, 229, 0.03)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #8b5cf6', color: 'var(--text-primary)', fontSize: '13px' }}>
                    💡 {activeTx.remarks || 'No security remarks logged.'}
                  </p>
                </div>

                {/* Gate Ticket Render box (Visual only) */}
                <div style={{ border: '2px dashed var(--border)', padding: '16px', borderRadius: '8px', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Gate Pass Ticket Summary Preview</span>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    DINESH EXPORTS SECURITY SYSTEM - {activeTx.passNo}<br />
                    VEHICLE: {activeTx.vehicleNo} | DIR: {activeTx.type.toUpperCase()}<br />
                    FROM/TO: {activeTx.party}<br />
                    NET WEIGHT: {activeTx.weightNet.toLocaleString()} Kgs<br />
                    IN: {activeTx.inTime} | SIGNATURE: Verified
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Select a Gate transaction from the list to view full security logs.
              </div>
            )
          )}

        </div>
      </div>

    </div>
  );
}
