import React, { useState } from 'react';
import { Save, Printer, Edit2, Trash2, XCircle, Plus, Eye } from 'lucide-react';

export default function YarnIndentApprovalForm() {
  const [formData, setFormData] = useState({
    apprdNo: '1', apprdDate: '18-Jul-2026', userId: 'TEST001', userName: 'TEST',
    indentNo: '-', indentDate: '18-Jul-2026', designNo: '', dsnDate: '18-Jul-2026',
    partyName: '', fabric: '', weaveDesign: '', orderMtrs: '', remarksText: ''
  });

  const [tableData, setTableData] = useState([
    { id: 1, yarnCount: '', orderMtrs: '', warpQty: '', weftQty: '', totReqdQty: '', stockQty: '', appdQty: '', poAllow: '' }
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', padding: '24px' }}>
      
      {/* Top Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '12px 16px', fontWeight: 'bold', fontSize: '18px', borderRadius: '4px 4px 0 0' }}>
        Yarn Requirement Indent - Approval Entry
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Form Section */}
        <div style={{ flex: 1, minWidth: '400px', display: 'grid', gridTemplateColumns: '80px 1fr 80px 1fr', gap: '12px', alignItems: 'center' }}>
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Apprd No.</label>
          <input type="text" className="form-control" name="apprdNo" value={formData.apprdNo} onChange={handleChange} disabled />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Apprd Date</label>
          <input type="text" className="form-control" name="apprdDate" value={formData.apprdDate} onChange={handleChange} />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Indent No.</label>
          <div style={{ display: 'flex' }}>
            <select className="form-control" style={{ width: '40px', padding: '2px' }}><option>-</option></select>
            <input type="text" className="form-control" name="indentNo" value={formData.indentNo} onChange={handleChange} style={{ flex: 1, marginLeft: '-1px' }} />
          </div>
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Indent Date</label>
          <input type="text" className="form-control" name="indentDate" value={formData.indentDate} onChange={handleChange} />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Design No.</label>
          <input type="text" className="form-control" name="designNo" value={formData.designNo} onChange={handleChange} />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Dsn Date</label>
          <input type="text" className="form-control" name="dsnDate" value={formData.dsnDate} onChange={handleChange} />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Party Name</label>
          <input type="text" className="form-control" name="partyName" value={formData.partyName} onChange={handleChange} style={{ gridColumn: 'span 3' }} />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Fabric</label>
          <input type="text" className="form-control" name="fabric" value={formData.fabric} onChange={handleChange} style={{ gridColumn: 'span 3' }} />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Weave Design</label>
          <input type="text" className="form-control" name="weaveDesign" value={formData.weaveDesign} onChange={handleChange} />
          
          <label style={{ fontSize: '12px', fontWeight: '600' }}>Order Mtrs</label>
          <input type="text" className="form-control" name="orderMtrs" value={formData.orderMtrs} onChange={handleChange} />

        </div>

        {/* Right Info Section */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', width: '60px' }}>User Id</label>
                <input type="text" className="form-control" name="userId" value={formData.userId} disabled style={{ flex: 1 }} />
                <label style={{ fontSize: '12px', fontWeight: '600', width: '70px' }}>User Name</label>
                <input type="text" className="form-control" name="userName" value={formData.userName} disabled style={{ flex: 1 }} />
            </div>
            <textarea 
                className="form-control" 
                style={{ flex: 1, minHeight: '120px' }}
                value={formData.remarksText}
                onChange={handleChange}
                name="remarksText"
                placeholder="Remarks..."
            />
        </div>
      </div>

      {/* Middle Table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid var(--border)' }}>
            Countwise Required Details
        </div>
        <div style={{ display: 'flex', padding: '12px', gap: '8px', borderBottom: '1px solid var(--border)' }}>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <Plus size={14} /> Add
            </button>
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} /> View Indent
            </button>
        </div>
        <div style={{ overflowX: 'auto', flex: 1 }}>
            <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                    <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>S.No</th>
                        <th>Yarn Count</th>
                        <th style={{ textAlign: 'right' }}>Order Mtrs</th>
                        <th style={{ textAlign: 'right' }}>Warp Qty</th>
                        <th style={{ textAlign: 'right' }}>Weft Qty</th>
                        <th style={{ textAlign: 'right' }}>Tot Reqd Qty</th>
                        <th style={{ textAlign: 'right' }}>Stock Qty</th>
                        <th style={{ textAlign: 'right' }}>Appd Qty</th>
                        <th style={{ textAlign: 'center' }}>PO Allow</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, i) => (
                        <tr key={row.id}>
                            <td style={{ textAlign: 'center' }}>{i + 1}</td>
                            <td><select className="form-control" style={{ padding: '2px', height: '28px' }}><option>-</option></select></td>
                            <td><input type="text" className="form-control" style={{ padding: '2px', height: '28px', textAlign: 'right' }} /></td>
                            <td><input type="text" className="form-control" style={{ padding: '2px', height: '28px', textAlign: 'right' }} /></td>
                            <td><input type="text" className="form-control" style={{ padding: '2px', height: '28px', textAlign: 'right' }} /></td>
                            <td><input type="text" className="form-control" style={{ padding: '2px', height: '28px', textAlign: 'right', background: 'var(--bg-secondary)' }} readOnly /></td>
                            <td><input type="text" className="form-control" style={{ padding: '2px', height: '28px', textAlign: 'right' }} /></td>
                            <td><input type="text" className="form-control" style={{ padding: '2px', height: '28px', textAlign: 'right' }} /></td>
                            <td style={{ textAlign: 'center' }}><input type="checkbox" style={{ cursor: 'pointer' }} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', fontWeight: '600' }}>Total Kgs</label>
        <input type="text" className="form-control" style={{ width: '120px' }} readOnly />
        
        <label style={{ fontSize: '12px', fontWeight: '600', marginLeft: '16px' }}>Remarks</label>
        <input type="text" className="form-control" style={{ flex: 1 }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={16} /> Save</button>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Printer size={16} /> Print</button>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Edit2 size={16} /> Edit</button>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e11d48', borderColor: '#fecdd3' }}><Trash2 size={16} /> Delete</button>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16} /> Close</button>
      </div>

    </div>
  );
}
