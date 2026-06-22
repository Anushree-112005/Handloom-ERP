import { useState, useMemo, useEffect } from 'react';
import { 
  Shield, Search, Plus, Filter, FileText, Printer, Check, 
  Clock, Truck, Key, Eye, Trash2, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import api, { partyAPI, buyerOrderAPI } from '../../services/api';

export default function GateTransaction() {
  // Local Storage Database
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('gate_transaction_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [dbVehicles, setDbVehicles] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partRes, vehRes, boRes] = await Promise.all([
          partyAPI.list().catch(() => ({ data: [] })),
          api.get('/fleet/vehicles').catch(() => ({ data: [] })),
          buyerOrderAPI.list().catch(() => ({ data: [] }))
        ]);
        setDbVehicles(vehRes.data || []);
        setDbOrders(boRes.data || []);

        const fetchedVehicles = vehRes.data || [];
        const fetchedBOs = boRes.data || [];
        const fetchedParties = partRes.data || [];

        // Check and seed local storage if empty
        const savedTx = localStorage.getItem('gate_transaction_data');
        if (!savedTx || JSON.parse(savedTx).length === 0) {
          const seedData = [];
          for (let i = 0; i < 10; i++) {
            const vehicle = fetchedVehicles[(i + 6) % fetchedVehicles.length] || { vehicle_number: `TN-33-AA-100${i+1}` };
            const bo = fetchedBOs[(i + 3) % fetchedBOs.length] || { ibpo_number: `IBPO-${String(i+1).padStart(5, '0')}`, buyer_name: 'HM Sweden' };
            const party = fetchedParties[(i + 3) % fetchedParties.length] || { company_name: bo.buyer_name || 'Raymond Ltd' };
            const tare = 5000 + i * 100;
            const gross = 8000 + i * 300;
            seedData.push({
              id: `GT-${String(i + 1).padStart(5, '0')}`,
              passNo: `GP-${String(i + 1).padStart(5, '0')}`,
              vehicleNo: vehicle.vehicle_number,
              type: i % 2 === 0 ? "Inward" : "Outward",
              party: party.company_name,
              material: i % 2 === 0 ? "Cotton Yarn Cones" : "Finished Fabric Bales",
              qty: `${50 + i} Packages`,
              driverName: `Driver ${i + 10}`,
              weightTare: tare,
              weightGross: gross,
              weightNet: gross - tare,
              inTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
              outTime: i % 2 === 0 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16) : '',
              status: i % 2 === 0 ? "Completed" : "Checked In",
              remarks: `Verification pass for order ${bo.ibpo_number}`
            });
          }
          localStorage.setItem('gate_transaction_data', JSON.stringify(seedData));
          setTransactions(seedData);
          if (seedData.length > 0) {
            setSelectedId(seedData[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Form State
  const [selectedId, setSelectedId] = useState(null);
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
      const vNo = String(t.vehicleNo || '');
      const pName = String(t.party || '');
      const passNoStr = String(t.passNo || '');
      const sTerm = String(searchTerm || '');
      
      const matchSearch = vNo.toLowerCase().includes(sTerm.toLowerCase()) || 
                          pName.toLowerCase().includes(sTerm.toLowerCase()) || 
                          passNoStr.toLowerCase().includes(sTerm.toLowerCase());
      const matchType = filterType === 'All' || t.type === filterType;
      return matchSearch && matchType;
    });
  }, [transactions, searchTerm, filterType]);

  const handleSelectTx = (tx) => {
    setSelectedId(tx.id);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const nextId = `GT-${String(transactions.length + 1).padStart(5, '0')}`;
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
      const updated = transactions.map(t => {
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
      });
      setTransactions(updated);
      localStorage.setItem('gate_transaction_data', JSON.stringify(updated));
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
      const updated = [newEntry, ...transactions];
      setTransactions(updated);
      localStorage.setItem('gate_transaction_data', JSON.stringify(updated));
    }
    setIsEditing(false);
    alert("Gate transaction saved successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this gate record?")) {
      const remaining = transactions.filter(t => t.id !== id);
      setTransactions(remaining);
      localStorage.setItem('gate_transaction_data', JSON.stringify(remaining));
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
    }
  };

  const handleCheckOut = (id) => {
    const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated = transactions.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Completed', outTime: timeNow };
      }
      return t;
    });
    setTransactions(updated);
    localStorage.setItem('gate_transaction_data', JSON.stringify(updated));
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
                    list="vehicles-list"
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

      <datalist id="vehicles-list">
        {dbVehicles.map(v => (
          <option key={v.id} value={v.vehicle_number}>{v.vehicle_number} ({v.make} {v.model})</option>
        ))}
      </datalist>

    </div>
  );
}
