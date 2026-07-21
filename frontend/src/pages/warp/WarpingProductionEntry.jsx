import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Eye, RefreshCw, X } from 'lucide-react';
import { workOrderTransactionAPI } from '../../services/api';

export default function WarpingProductionEntry() {
  const navigate = useNavigate();

  // Top header fields state
  const [header, setHeader] = useState({
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
  });

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

  const handleSave = async () => {
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
      await workOrderTransactionAPI.create(payload);
      alert('Warping Production SET Entry saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save Warping Production Entry.');
    }
  };

  const handleReset = () => {
    setHeader({
      refNo: String(Math.floor(Math.random() * 1000) + 1),
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
    });
    setParticulars([]);
    setYarnTaken([]);
    setSummary({
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
  };

  // Totals calculation
  const totalWarpMtr = particulars.reduce((sum, p) => sum + (parseFloat(p.warpMtr) || 0), 0);
  const totalNetWt = particulars.reduce((sum, p) => sum + (parseFloat(p.netWt) || 0), 0);
  const totalGrsWt = particulars.reduce((sum, p) => sum + (parseFloat(p.grsWt) || 0), 0);
  const totalBreakage = particulars.reduce((sum, p) => sum + (parseFloat(p.breakage) || 0), 0);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      
      {/* Top Banner */}
      <div style={{ textAlignment: 'center', textAlign: 'center', fontSize: '12px', color: '#6b21a8', fontWeight: 600, marginBottom: '6px' }}>
        Warping/Sizing Transaction\Warping Set Report Entry
      </div>

      {/* Main Container Form */}
      <div style={{ border: '2px solid #d946ef', borderRadius: '4px', background: '#e0f2fe', overflow: 'hidden' }}>
        
        {/* Pink Header Title */}
        <div style={{ background: '#d946ef', color: 'white', fontWeight: 800, textAlign: 'center', padding: '8px', fontSize: '18px' }}>
          Warping SET Entry
        </div>

        {/* Top Header Fields Grid */}
        <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px', fontSize: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Ref No</span>
            <input type="text" name="refNo" value={header.refNo} onChange={handleHeaderChange} style={{ width: '60px', padding: '2px 4px', border: '1px solid #94a3b8' }} />
            <span style={{ margin: '0 6px', fontWeight: 600 }}>Prod Type</span>
            <select name="prodType" value={header.prodType} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Sizing">Sizing</option>
              <option value="Direct">Direct</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Order Type</span>
            <select name="orderType" value={header.orderType} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Job Work">Job Work</option>
              <option value="Own Production">Own Production</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Set Date</span>
            <input type="date" name="setDate" value={header.setDate} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Sizing Name</span>
            <select name="sizingName" value={header.sizingName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }}>
              <option value="">- Select Sizing Mill -</option>
              <option value="VETRIVEL SIZING MILL">VETRIVEL SIZING MILL</option>
              <option value="DINESH SIZING UNIT">DINESH SIZING UNIT</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Sizing ID</span>
            <input type="text" name="sizingId" value={header.sizingId} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Machine No</span>
            <input type="text" name="machineNo" value={header.machineNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Party Name</span>
            <input type="text" name="partyName" value={header.partyName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Beam Width</span>
            <input type="text" name="beamWidth" value={header.beamWidth} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Warp Count</span>
            <select name="warpCount" value={header.warpCount} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="40s Cotton">40s Cotton</option>
              <option value="60s Combed">60s Combed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Warp Set No.</span>
            <input type="text" name="warpSetNo" value={header.warpSetNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Warp Set ID</span>
            <input type="text" name="warpSetId" value={header.warpSetId} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Mill Name</span>
            <select name="millName" value={header.millName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Sri Raja Rajeshwari">Sri Raja Rajeshwari</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Lot No</span>
            <input type="text" name="lotNo" value={header.lotNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Against</span>
            <select name="against" value={header.against} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Order">Order</option>
              <option value="Stock">Stock</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Warp Ends</span>
            <input type="text" name="warpEnds" value={header.warpEnds} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Yarn Rate</span>
            <input type="text" name="yarnRate" value={header.yarnRate} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Yarn GST</span>
            <input type="text" name="yarnGst" value={header.yarnGst} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Design No.</span>
            <select name="designNo" value={header.designNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="DES-4091">DES-4091</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>IBPO No.</span>
            <select name="ibpoNo" value={header.ibpoNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="IBPO-1002">IBPO-1002</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Warping Mtrs</span>
            <input type="text" name="warpingMtrs" value={header.warpingMtrs} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Calc Gms/Mtr</span>
            <input type="text" name="calcGmsMtr" value={header.calcGmsMtr} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Buyer Name</span>
            <input type="text" name="buyerName" value={header.buyerName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Warper 1 Name</span>
            <input type="text" name="warper1Name" value={header.warper1Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Warper 2 Name</span>
            <input type="text" name="warper2Name" value={header.warper2Name} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px 4px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Beam Type</span>
            <select name="beamType" value={header.beamType} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
            </select>
          </div>

        </div>

        {/* Section 1: Warping Particulars */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ background: '#7e22ce', color: 'white', fontWeight: 700, padding: '4px 12px', fontSize: '13px' }}>
            Warping Particulars
          </div>

          <div style={{ padding: '8px', background: '#dbeafe', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: 'white' }}>
              <thead>
                <tr style={{ background: '#cbd5e1', textAlign: 'center' }}>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '40px' }}>S.No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Beam No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Yarn Count</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Ends</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Colour</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Warp Mtr</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Net Wt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Tare Wt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Grs Wt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Breakage</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Input Row */}
                <tr>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.beamNo} onChange={e => setNewPart({...newPart, beamNo: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newPart.yarnCount} onChange={e => setNewPart({...newPart, yarnCount: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                      <option value="40s">40s</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.ends} onChange={e => setNewPart({...newPart, ends: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newPart.colour} onChange={e => setNewPart({...newPart, colour: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                      <option value="White">White</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.warpMtr} onChange={e => setNewPart({...newPart, warpMtr: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.netWt} onChange={e => setNewPart({...newPart, netWt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.tareWt} onChange={e => setNewPart({...newPart, tareWt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.grsWt} onChange={e => setNewPart({...newPart, grsWt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newPart.breakage} onChange={e => setNewPart({...newPart, breakage: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>
                    <button onClick={addParticularRow} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Add</button>
                  </td>
                </tr>

                {/* Existing Items */}
                {particulars.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.beamNo}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.yarnCount}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.ends}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.colour}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.warpMtr}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.netWt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.tareWt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.grsWt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.breakage}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                      <button onClick={() => removeParticularRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pink Total Row */}
            <div style={{ background: '#fbcfe8', padding: '4px 12px', display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid #f472b6' }}>
              <div>Total: {particulars.length} Beams | Mtrs: {totalWarpMtr} | Grs Wt: {totalGrsWt}</div>
              <div>Tot Breakage %: {totalBreakage}%</div>
            </div>
          </div>
        </div>

        {/* Section 2: Yarn Taken Detail */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ background: '#7e22ce', color: 'white', fontWeight: 700, padding: '4px 12px', fontSize: '13px' }}>
            Yarn Taken Detail
          </div>

          <div style={{ padding: '8px', background: '#dbeafe', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: 'white' }}>
              <thead>
                <tr style={{ background: '#cbd5e1', textAlign: 'center' }}>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '40px' }}>S.No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Yarn Count</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Colour</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Taken Kgs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Consumed Kgs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Baln. Kgs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Full Cone Wgt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Baby Cone Wgt</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Short/Excess</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Total Kgs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newYarn.yarnCount} onChange={e => setNewYarn({...newYarn, yarnCount: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                      <option value="40s">40s</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newYarn.colour} onChange={e => setNewYarn({...newYarn, colour: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                      <option value="White">White</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newYarn.takenKgs} onChange={e => setNewYarn({...newYarn, takenKgs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newYarn.consumedKgs} onChange={e => setNewYarn({...newYarn, consumedKgs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newYarn.balnKgs} onChange={e => setNewYarn({...newYarn, balnKgs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newYarn.fullConeWgt} onChange={e => setNewYarn({...newYarn, fullConeWgt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newYarn.babyConeWgt} onChange={e => setNewYarn({...newYarn, babyConeWgt: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newYarn.shortExcess} onChange={e => setNewYarn({...newYarn, shortExcess: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newYarn.totalKgs} onChange={e => setNewYarn({...newYarn, totalKgs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>
                    <button onClick={addYarnRow} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Add</button>
                  </td>
                </tr>

                {yarnTaken.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.yarnCount}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.colour}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.takenKgs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.consumedKgs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.balnKgs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.fullConeWgt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.babyConeWgt}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.shortExcess}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.totalKgs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                      <button onClick={() => removeYarnRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Summary Fields Grid */}
        <div style={{ padding: '8px 12px', background: '#dbeafe', fontSize: '11px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Yarn Taken Kgs</span>
            <input type="text" name="yarnTakenKgs" value={summary.yarnTakenKgs} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Consumed Kgs</span>
            <input type="text" name="consumedKgs" value={summary.consumedKgs} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Rewinding</span>
            <input type="text" name="rewinding" value={summary.rewinding} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Full Cone Wt</span>
            <input type="text" name="fullConeWt" value={summary.fullConeWt} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Baby Cone</span>
            <input type="text" name="babyCone" value={summary.babyCone} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Ex/Sh</span>
            <input type="text" name="exSh" value={summary.exSh} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Beam Count</span>
            <input type="text" name="beamCount" value={summary.beamCount} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Grms per Mtr</span>
            <input type="text" name="grmsPerMtr" value={summary.grmsPerMtr} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>CutCone Loss (Rs.)</span>
            <input type="text" name="cutConeLoss" value={summary.cutConeLoss} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Warp Waste</span>
            <input type="text" name="warpWaste" value={summary.warpWaste} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Sizing Waste</span>
            <input type="text" name="sizingWaste" value={summary.sizingWaste} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 4' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Pallet/Bag Nos.</span>
            <input type="text" name="palletBagNos" value={summary.palletBagNos} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 4' }}>
            <span style={{ minWidth: '100px', fontWeight: 600 }}>Warping Remarks</span>
            <input type="text" name="warpingRemarks" value={summary.warpingRemarks} onChange={handleSummaryChange} style={{ flex: 1, padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
          </div>

        </div>

        {/* Action Buttons Footer Bar */}
        <div style={{ background: '#64748b', padding: '10px 16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button onClick={handleReset} style={{ background: '#2563eb', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>New</button>
          <button onClick={handleSave} style={{ background: '#10b981', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
          <button onClick={handleReset} style={{ background: '#f59e0b', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          <button onClick={() => navigate('/warp/transaction/reports?tab=warping_report')} style={{ background: '#f8fafc', color: '#1e293b', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>View</button>
          <button onClick={() => navigate(-1)} style={{ background: '#ef4444', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Exit</button>
        </div>

      </div>
    </div>
  );
}
