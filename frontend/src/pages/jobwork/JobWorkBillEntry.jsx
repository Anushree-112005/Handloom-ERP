import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { workOrderTransactionAPI } from '../../services/api';

export default function JobWorkBillEntry() {
  const navigate = useNavigate();

  // Header State
  const [header, setHeader] = useState({
    refNo: '1066',
    entryDate: new Date().toISOString().substring(0, 10),
    pmtRno: '34467',
    entryType: 'Set Entry',
    sizingName: 'VETRIVEL SIZING MILL',
    sizingId: 'VSM1',
    orderNo: '-',
    billNo: '',
    billDate: new Date().toISOString().substring(0, 10),
    ratePer: 'Per Mtr',
    dueDaysDate: new Date().toISOString().substring(0, 10)
  });

  // Set Details Table State
  const [setDetails, setSetDetails] = useState([
    { id: 1, dcSetNo: '-', setDate: '', count: '', millName: '', ends: '', warpMtrs: '', sizedMtrs: '', takenKgs: '', consKgs: '', rate: '', amount: '' }
  ]);

  const [newItem, setNewItem] = useState({ dcSetNo: '-', setDate: '', count: '', millName: '', ends: '', warpMtrs: '', sizedMtrs: '', takenKgs: '', consKgs: '', rate: '', amount: '' });

  // Calculations & Bottom fields
  const [totals, setTotals] = useState({
    addLess: '0',
    taxType: '-',
    cgstPct: '0',
    sgstPct: '0',
    igstPct: '0',
    remarks: '',
    tdsPct: 'TDS - 194C',
    tdsVal: '2'
  });

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleTotalsChange = (e) => {
    setTotals({ ...totals, [e.target.name]: e.target.value });
  };

  const addItemRow = () => {
    setSetDetails([...setDetails, { ...newItem, id: Date.now() }]);
    setNewItem({ dcSetNo: '-', setDate: '', count: '', millName: '', ends: '', warpMtrs: '', sizedMtrs: '', takenKgs: '', consKgs: '', rate: '', amount: '' });
  };

  const removeItemRow = (id) => {
    setSetDetails(setSetDetails.filter(item => item.id !== id));
  };

  // Automated Calculations
  const grossAmount = setDetails.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const addLessVal = parseFloat(totals.addLess) || 0;
  const subTotal = grossAmount + addLessVal;
  
  const cgstVal = subTotal * ((parseFloat(totals.cgstPct) || 0) / 100);
  const sgstVal = subTotal * ((parseFloat(totals.sgstPct) || 0) / 100);
  const igstVal = subTotal * ((parseFloat(totals.igstPct) || 0) / 100);
  const totalTax = cgstVal + sgstVal + igstVal;
  
  const netAmount = subTotal + totalTax;
  const tdsPctVal = parseFloat(totals.tdsVal) || 0;
  const tdsAmount = netAmount * (tdsPctVal / 100);
  const payableAmount = netAmount - tdsAmount;

  const handleSave = async () => {
    const payload = {
      module_type: 'ws_bills',
      date: header.billDate,
      buyer_name: header.sizingName || 'Vendor',
      status: 'Active',
      details: {
        header,
        setDetails,
        totals: {
          ...totals,
          grossAmount,
          netAmount,
          payableAmount
        }
      }
    };
    try {
      await workOrderTransactionAPI.create(payload);
      alert('Job Work Bill Entry saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save Job Work Bill Entry.');
    }
  };

  const handleReset = () => {
    setHeader({
      refNo: String(Math.floor(Math.random() * 1000) + 1000),
      entryDate: new Date().toISOString().substring(0, 10),
      pmtRno: String(Math.floor(Math.random() * 50000) + 10000),
      entryType: 'Set Entry',
      sizingName: 'VETRIVEL SIZING MILL',
      sizingId: 'VSM1',
      orderNo: '-',
      billNo: '',
      billDate: new Date().toISOString().substring(0, 10),
      ratePer: 'Per Mtr',
      dueDaysDate: new Date().toISOString().substring(0, 10)
    });
    setSetDetails([]);
    setTotals({
      addLess: '0',
      taxType: '-',
      cgstPct: '0',
      sgstPct: '0',
      igstPct: '0',
      remarks: '',
      tdsPct: 'TDS - 194C',
      tdsVal: '2'
    });
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      
      {/* Top Banner */}
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b21a8', fontWeight: 600, marginBottom: '6px' }}>
        Warping/Sizing Transaction\Warping/Sizing Bills Entry
      </div>

      {/* Main Container Form */}
      <div style={{ border: '2px solid #d946ef', borderRadius: '4px', background: '#e0f2fe', overflow: 'hidden' }}>
        
        {/* Magenta Header Title */}
        <div style={{ background: '#d946ef', color: 'white', fontWeight: 800, textAlign: 'center', padding: '8px', fontSize: '18px' }}>
          Warping / Sizing Bills Entry
        </div>

        {/* Top Header Fields Grid */}
        <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 14px', fontSize: '11.5px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Ref No.</span>
            <input type="text" name="refNo" value={header.refNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Entry Date</span>
            <input type="date" name="entryDate" value={header.entryDate} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Pmt Rno</span>
            <input type="text" name="pmtRno" value={header.pmtRno} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Entry Type</span>
            <select name="entryType" value={header.entryType} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="Set Entry">Set Entry</option>
              <option value="Process Entry">Process Entry</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Sizing Name</span>
            <select name="sizingName" value={header.sizingName} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }}>
              <option value="VETRIVEL SIZING MILL">VETRIVEL SIZING MILL</option>
              <option value="DINESH SIZING MILL">DINESH SIZING MILL</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Sizing ID</span>
            <input type="text" name="sizingId" value={header.sizingId} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Order No.</span>
            <select name="orderNo" value={header.orderNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="-">-</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Bill No.</span>
            <input type="text" name="billNo" value={header.billNo} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Bill Date</span>
            <input type="date" name="billDate" value={header.billDate} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Rate Per</span>
            <select name="ratePer" value={header.ratePer} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
              <option value="Per Mtr">Per Mtr</option>
              <option value="Per Kg">Per Kg</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ minWidth: '90px', fontWeight: 600 }}>Due Days / Date</span>
            <input type="date" name="dueDaysDate" value={header.dueDaysDate} onChange={handleHeaderChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }} />
          </div>

        </div>

        {/* Section: Set Details Table */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ background: '#7e22ce', color: 'white', fontWeight: 700, padding: '4px 12px', fontSize: '13px' }}>
            Set Details
          </div>

          <div style={{ padding: '8px', background: '#dbeafe', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: 'white' }}>
              <thead>
                <tr style={{ background: '#cbd5e1', textAlign: 'center' }}>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '40px' }}>S.No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>DC / Set No</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Set Date</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Count</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Mill Name</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Ends</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Warp Mtrs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Sized Mtrs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Taken Kgs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Cons Kgs</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Rate</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px' }}>Amount</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '4px', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <select value={newItem.dcSetNo} onChange={e => setNewItem({...newItem, dcSetNo: e.target.value})} style={{ width: '100%', border: 'none' }}>
                      <option value="-">-</option>
                    </select>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="date" value={newItem.setDate} onChange={e => setNewItem({...newItem, setDate: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.count} onChange={e => setNewItem({...newItem, count: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.millName} onChange={e => setNewItem({...newItem, millName: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.ends} onChange={e => setNewItem({...newItem, ends: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.warpMtrs} onChange={e => setNewItem({...newItem, warpMtrs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.sizedMtrs} onChange={e => setNewItem({...newItem, sizedMtrs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.takenKgs} onChange={e => setNewItem({...newItem, takenKgs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.consKgs} onChange={e => setNewItem({...newItem, consKgs: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.rate} onChange={e => setNewItem({...newItem, rate: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px' }}>
                    <input type="text" value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} style={{ width: '100%', border: 'none' }} />
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>
                    <button onClick={addItemRow} style={{ background: '#f1f5f9', border: '1px solid #94a3b8', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Add</button>
                  </td>
                </tr>

                {setDetails.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.dcSetNo}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.setDate}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.count}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.millName}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.ends}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.warpMtrs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.sizedMtrs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.takenKgs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.consKgs}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.rate}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>{row.amount}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>
                      <button onClick={() => removeItemRow(row.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Totals & Taxes Grid */}
        <div style={{ padding: '8px 12px', background: '#dbeafe', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 12px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>Total</span>
              <input type="text" readOnly value={setDetails.length} style={{ flex: 1, padding: '2px', background: '#cffaff', border: '1px solid #06b6d4' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>Add/Less</span>
              <input type="text" name="addLess" value={totals.addLess} onChange={handleTotalsChange} style={{ flex: 1, padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>Gross Amount</span>
              <input type="text" readOnly value={grossAmount.toFixed(2)} style={{ flex: 1, padding: '2px', background: '#cffaff', border: '1px solid #06b6d4', fontWeight: 700 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>Tax Type</span>
              <select name="taxType" value={totals.taxType} onChange={handleTotalsChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8' }}>
                <option value="-">-</option>
                <option value="GST 5%">GST 5%</option>
                <option value="GST 12%">GST 12%</option>
                <option value="GST 18%">GST 18%</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>CGST%</span>
              <input type="text" name="cgstPct" value={totals.cgstPct} onChange={handleTotalsChange} style={{ width: '40px', padding: '2px', border: '1px solid #94a3b8' }} />
              <input type="text" readOnly value={cgstVal.toFixed(2)} style={{ flex: 1, marginLeft: '4px', padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>SGST%</span>
              <input type="text" name="sgstPct" value={totals.sgstPct} onChange={handleTotalsChange} style={{ width: '40px', padding: '2px', border: '1px solid #94a3b8' }} />
              <input type="text" readOnly value={sgstVal.toFixed(2)} style={{ flex: 1, marginLeft: '4px', padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>IGST%</span>
              <input type="text" name="igstPct" value={totals.igstPct} onChange={handleTotalsChange} style={{ width: '40px', padding: '2px', border: '1px solid #94a3b8' }} />
              <input type="text" readOnly value={igstVal.toFixed(2)} style={{ flex: 1, marginLeft: '4px', padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 3' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>Remarks</span>
              <input type="text" name="remarks" value={totals.remarks} onChange={handleTotalsChange} style={{ flex: 1, padding: '2px', background: 'white', border: '1px solid #94a3b8' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>Net Amt</span>
              <input type="text" readOnly value={netAmount.toFixed(2)} style={{ flex: 1, padding: '2px', background: '#cffaff', border: '1px solid #06b6d4', fontWeight: 700 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gridColumn: 'span 3' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>TDS %</span>
              <select name="tdsPct" value={totals.tdsPct} onChange={handleTotalsChange} style={{ flex: 1, padding: '2px', border: '1px solid #94a3b8', background: 'white' }}>
                <option value="TDS - 194C">TDS - 194C</option>
              </select>
              <input type="text" name="tdsVal" value={totals.tdsVal} onChange={handleTotalsChange} style={{ width: '40px', marginLeft: '6px', padding: '2px', border: '1px solid #94a3b8' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ minWidth: '90px', fontWeight: 600 }}>Payable Amount</span>
              <input type="text" readOnly value={payableAmount.toFixed(2)} style={{ flex: 1, padding: '2px', background: '#fbcfe8', border: '1px solid #f472b6', fontWeight: 800, color: '#9d174d' }} />
            </div>

          </div>

        </div>

        {/* Action Buttons Footer Bar */}
        <div style={{ background: '#64748b', padding: '10px 16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button onClick={handleReset} style={{ background: '#2563eb', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>New</button>
          <button onClick={handleSave} style={{ background: '#10b981', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
          <button onClick={handleReset} style={{ background: '#f59e0b', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          <button onClick={() => navigate('/warp/transaction/reports?tab=ws_bills')} style={{ background: '#f8fafc', color: '#1e293b', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>View</button>
          <button onClick={() => navigate(-1)} style={{ background: '#ef4444', color: 'white', padding: '6px 24px', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Exit</button>
        </div>

      </div>
    </div>
  );
}
