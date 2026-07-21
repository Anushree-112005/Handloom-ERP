import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { workOrderTransactionAPI } from '../../services/api';

export default function SizingProductionEntry() {
  const navigate = useNavigate();

  // Top header fields state
  const [header, setHeader] = useState({
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
    sizer3Name: '',
    sizer4Name: '',
    sizer1Name: '',
    sizer2Name: '',
    noOfSizedBeam: '',
    parallelBeam: 'NO',
    prgNoFrom: '',
    prgNoTo: ''
  });

  // Sizing Particulars Table state
  const [particulars, setParticulars] = useState([
    { id: 1, prgNo: '-', beamNo: '', weaverBeamNo: '-', clothOutput: '-', grossWgt: '', tareWgt: '', netWgt: '', sizingMtr: '', beamType: '-', dly: '' }
  ]);

  const [newPart, setNewPart] = useState({ prgNo: '-', beamNo: '', weaverBeamNo: '-', clothOutput: '-', grossWgt: '', tareWgt: '', netWgt: '', sizingMtr: '', beamType: '-', dly: '' });
  const [sizingRemarks, setSizingRemarks] = useState('');

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

  const handleSave = async () => {
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
      await workOrderTransactionAPI.create(payload);
      alert('Sizing Production Entry saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save Sizing Production Entry.');
    }
  };

  const handleReset = () => {
    setHeader({
      refNo: String(Math.floor(Math.random() * 1000) + 1),
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
      sizer3Name: '',
      sizer4Name: '',
      sizer1Name: '',
      sizer2Name: '',
      noOfSizedBeam: '',
      parallelBeam: 'NO',
      prgNoFrom: '',
      prgNoTo: ''
    });
    setParticulars([]);
    setSizingRemarks('');
  };

  const totalNetWt = particulars.reduce((sum, p) => sum + (parseFloat(p.netWt) || 0), 0);
  const totalSizingMtr = particulars.reduce((sum, p) => sum + (parseFloat(p.sizingMtr) || 0), 0);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      
      {/* Top Navigation Banner */}
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b21a8', fontWeight: 600, marginBottom: '6px' }}>
        Warping/Sizing Transaction\Sizing Set Report Entry
      </div>

      {/* Main Container Form */}
      <div style={{ border: '2px solid #d946ef', borderRadius: '4px', background: '#e0f2fe', overflow: 'hidden' }}>
        
        {/* Magenta Header Title */}
        <div style={{ background: '#d946ef', color: 'white', fontWeight: 800, textAlign: 'center', padding: '8px', fontSize: '18px' }}>
          Sizing Set Details Entry
        </div>

        {/* Top Header Fields Grid */}
        <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 14px', fontSize: '11.5px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Ref No.</span>
            <input type="text" name="refNo" value={header.refNo} onChange={handleHeaderChange} style={{ width: '60px', padding: '2px', border: '1px solid #94a3b8' }} />
            <span style={{ margin: '0 4px', fontWeight: 600 }}>Prod Type</span>
            <select name="prodType" value={header.prodType} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Sizing">Sizing</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>SET Date</span>
            <input type="date" name="setDate" value={header.setDate} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warping Set ID</span>
            <select name="warpingSetId" value={header.warpingSetId} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="WSET-101">WSET-101</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizing Name</span>
            <select name="sizingName" value={header.sizingName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }}>
              <option value="-">- Select Sizing Mill -</option>
              <option value="VETRIVEL SIZING MILL">VETRIVEL SIZING MILL</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizing ID</span>
            <input type="text" name="sizingId" value={header.sizingId} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warp Set Date</span>
            <input type="date" name="warpSetDate" value={header.warpSetDate} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Beam Width</span>
            <input type="text" name="beamWidth" value={header.beamWidth} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Party Name</span>
            <select name="partyName" value={header.partyName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Raymond Ltd">Raymond Ltd</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Machine No</span>
            <input type="text" name="machineNo" value={header.machineNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warp Count</span>
            <select name="warpCount" value={header.warpCount} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="40s Cotton">40s Cotton</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warp Ends</span>
            <input type="text" name="warpEnds" value={header.warpEnds} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizing Set No</span>
            <input type="text" name="sizingSetNo" value={header.sizingSetNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>SET ID</span>
            <input type="text" name="setId" value={header.setId} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warping Mtrs</span>
            <input type="text" name="warpingMtrs" value={header.warpingMtrs} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Mill Name</span>
            <select name="millName" value={header.millName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Sri Raja Rajeshwari">Sri Raja Rajeshwari</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Design No.</span>
            <select name="designNo" value={header.designNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="DES-4091">DES-4091</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>IBPO No.</span>
            <select name="ibpoNo" value={header.ibpoNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="IBPO-1002">IBPO-1002</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warper 1 Name</span>
            <input type="text" name="warper1Name" value={header.warper1Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warper 2 Name</span>
            <input type="text" name="warper2Name" value={header.warper2Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Buyer Name</span>
            <input type="text" name="buyerName" value={header.buyerName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Warping Waste</span>
            <input type="text" name="warpingWaste" value={header.warpingWaste} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizing Waste</span>
            <input type="text" name="sizingWaste" value={header.sizingWaste} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizing Meter</span>
            <input type="text" name="sizingMeter" value={header.sizingMeter} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Elongation %</span>
            <input type="text" name="elongationPct" value={header.elongationPct} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizer1 Name</span>
            <input type="text" name="sizer1Name" value={header.sizer1Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizer2 Name</span>
            <input type="text" name="sizer2Name" value={header.sizer2Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizer3 Name</span>
            <input type="text" name="sizer3Name" value={header.sizer3Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Sizer4 Name</span>
            <input type="text" name="sizer4Name" value={header.sizer4Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>No of Sized Beam</span>
            <input type="text" name="noOfSizedBeam" value={header.noOfSizedBeam} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Parallel Beam</span>
            <select name="parallelBeam" value={header.parallelBeam} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="NO">NO</option>
              <option value="YES">YES</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Prg No From</span>
            <input type="text" name="prgNoFrom" value={header.prgNoFrom} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '95px', fontWeight: 600 }}>Prg No To</span>
            <input type="text" name="prgNoTo" value={header.prgNoTo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

        </div>

        {/* Section: Sizing Particularas Table */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ background: '#7e22ce', color: 'white', fontWeight: 700, padding: '4px 12px', fontSize: '13px' }}>
            Sizing Particularas
          </div>

          <div style={{ padding: '8px', background: '#dbeafe', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: 'white' }}>
              <thead>
                <tr style={{ background: '#cbd5e1', textAlign: 'center' }}>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '40px' }}>S.No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Prg No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Beam No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Weaver Beam No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Cloth Output</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Gross Wgt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Tare Wgt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Net Wgt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Sizing Mtr</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Beam Type</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Dly</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newPart.prgNo} onChange={e => setNewPart({...newPart, prgNo: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.beamNo} onChange={e => setNewPart({...newPart, beamNo: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newPart.weaverBeamNo} onChange={e => setNewPart({...newPart, weaverBeamNo: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newPart.clothOutput} onChange={e => setNewPart({...newPart, clothOutput: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.grossWgt} onChange={e => setNewPart({...newPart, grossWgt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.tareWgt} onChange={e => setNewPart({...newPart, tareWgt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.netWgt} onChange={e => setNewPart({...newPart, netWgt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.sizingMtr} onChange={e => setNewPart({...newPart, sizingMtr: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newPart.beamType} onChange={e => setNewPart({...newPart, beamType: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.dly} onChange={e => setNewPart({...newPart, dly: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>
                    <button onClick={addParticularRow} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Add</button>
                  </td>
                </tr>

                {particulars.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.prgNo}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.beamNo}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.weaverBeamNo}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.clothOutput}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.grossWgt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.tareWgt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.netWgt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.sizingMtr}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.beamType}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.dly}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                      <button onClick={() => removeParticularRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cyan Total Row */}
            <div style={{ background: '#cffaff', padding: '4px 12px', display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid #06b6d4' }}>
              <div>Total Beams: {particulars.length} | Net Wt: {totalNetWt} | Sizing Mtrs: {totalSizingMtr}</div>
              <div>Arrived Gms: 0.00</div>
            </div>
          </div>
        </div>

        {/* Bottom Remarks Section */}
        <div style={{ padding: '8px 12px', background: '#dbeafe', fontSize: '11.5px', display: 'flex', alignItems: 'center' }}>
          <span style={{ minWidth: '110px', fontWeight: 600 }}>Sizing Remarks</span>
          <input type="text" value={sizingRemarks} onChange={e => setSizingRemarks(e.target.value)} style={{ flex: 1, padding: '2px 6px', background: 'white', border: '1px solid #94a3b8' }} />
        </div>

        {/* Action Buttons Footer Bar */}
        <div style={{ background: '#64748b', padding: '10px 16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button onClick={handleReset} style={{ background: '#2563eb', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>New</button>
          <button onClick={handleSave} style={{ background: '#10b981', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
          <button onClick={handleReset} style={{ background: '#f59e0b', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          <button onClick={() => navigate('/warp/transaction/reports?tab=sizing_report')} style={{ background: '#f8fafc', color: '#1e293b', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>View</button>
          <button onClick={() => navigate(-1)} style={{ background: '#ef4444', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Exit</button>
        </div>

      </div>
    </div>
  );
}
