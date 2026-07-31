import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowDownLeft, ArrowLeft, Briefcase, CheckCircle, Download, Edit2, Eye, FileText, IndianRupee, Loader2, MapPin, Package, Phone, Plus, RefreshCw, RotateCcw, Save, Search, Trash2, User, Users, X, Filter, Globe, Mail, ClipboardList } from 'lucide-react';

import storesService from '../../services/storesService';

import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';

const conditionColors = {
  'Good': 'bg-emerald-50 text-emerald-600',
  'Damaged': 'bg-red-50 text-red-500',
  'Partial': 'bg-amber-50 text-amber-600',
};

const statusColors = {
  'Received': 'bg-emerald-50 text-emerald-600',
  'Pending': 'bg-amber-50 text-amber-600',
  'Cancelled': 'bg-slate-100 text-slate-500',
};

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function ReturnEntry() {
  const [view, setView] = useState('list');

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    issue_id: '', returned_by_id: '', received_by_id: '', items: []
  });

  const showToast = (msg, ok = true) => {
    if (!ok) alert(msg);
  };

  useEffect(() => { loadData(); }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [returnData, itms, iss, emps] = await Promise.all([
        storesService.getReturnsToStore(),
        storesService.getItems(),
        storesService.getDepartmentIssues(),
        storesService.getEmployees()
      ]);
      setReturns(returnData || []);
      setItemsList(itms || []);
      setIssuesList(iss || []);
      setEmployees(emps || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleIssueChange = (issueId) => {
    const sel = issuesList.find(i => i.id === parseInt(issueId));
    if (sel) {
      setFormData(prev => ({
        ...prev,
        issue_id: issueId,
        items: sel.items.map(i => ({
          item_id: i.item_id, category_id: i.category_id, uom_id: i.uom_id,
          quantity_returned: i.quantity_issued,
          reason: 'Excess Stock', condition: 'Good', remarks: ''
        }))
      }));
    } else {
      setFormData(prev => ({ ...prev, issue_id: issueId, items: [] }));
    }
  };

  const setItemField = (idx, field, val) => {
    const updated = [...formData.items];
    updated[idx][field] = val;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.returned_by_id) {
      showToast('Please select who is returning the items.', false); return;
    }
    if (formData.items.length === 0) {
      showToast('Return entry must contain at least one item.', false); return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        issue_id: formData.issue_id ? parseInt(formData.issue_id) : null,
        returned_by_id: parseInt(formData.returned_by_id),
        received_by_id: formData.received_by_id ? parseInt(formData.received_by_id) : null,
        items: formData.items.map(i => ({
          item_id: parseInt(i.item_id), category_id: parseInt(i.category_id), uom_id: parseInt(i.uom_id),
          quantity_returned: i.quantity_returned, reason: i.reason, condition: i.condition, remarks: i.remarks
        }))
      };

      if (editingId) {
        if (storesService.updateReturnToStore) {
          await storesService.updateReturnToStore(editingId, payload);
          showToast('Return updated successfully!');
        } else {
          showToast('Update endpoint missing in storesService.', false);
        }
      } else {
        await storesService.createReturnToStore(payload);
        showToast('Return recorded! Stock levels updated.');
      }
      setView('list');
      setEditingId(null);
      loadData();
    } catch (err) { console.error(err); showToast('Failed to log return.', false); }
    finally { setSubmitLoading(false); }
  };

  const handleEdit = async (ret) => {
    const detailedReturn = await storesService.getReturnToStore(ret.id);
    setFormData({
      issue_id: detailedReturn.issue_id ? detailedReturn.issue_id.toString() : '',
      returned_by_id: detailedReturn.returned_by_id ? detailedReturn.returned_by_id.toString() : '',
      received_by_id: detailedReturn.received_by_id ? detailedReturn.received_by_id.toString() : '',
      items: detailedReturn.items || []
    });
    setEditingId(ret.id);
    setView('form');
  };

  const handleDelete = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
  };

  const filteredReturns = returns.filter(r =>
    r.return_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.returned_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkedIssue = issuesList.find(i => i.id === parseInt(formData.issue_id));

  const stats = [
    {
      label: 'Total Returns', value: returns.length,
      icon: <RotateCcw size={24} />, color: '#f97316'
    },
    {
      label: 'Good Condition', value: returns.filter(r => r.status === 'Received').length,
      icon: <CheckCircle size={24} />, color: '#10b981'
    },
    {
      label: 'Dept. Issues', value: issuesList.length,
      icon: <Package size={24} />, color: '#3b82f6'
    },
    {
      label: 'Employees', value: employees.length,
      icon: <Users size={24} />, color: '#8b5cf6'
    },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      {view === 'list' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={24} color="var(--primary)" /> Return to Store
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Deposit unused, excess or damaged material back to main stores.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ExportButton
              data={filteredReturns}
              filename="Return_To_Store_Report"
              pdfTitle="Return To Store Report"
              columns={[
                { header: 'Return No', key: 'return_no' },
                { header: 'Return Date', key: 'return_date', render: (row) => row.return_date ? new Date(row.return_date).toLocaleDateString('en-IN') : '-' },
                { header: 'Returned By', key: 'returned_by_name' },
                { header: 'Received By', key: 'received_by_name' },
                { header: 'Status', key: 'status' }
              ]}
            />
            <button onClick={() => { setFormData({ issue_id: '', returned_by_id: '', received_by_id: '', items: [] }); setEditingId(null); setView('form'); }}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
              <Plus size={16} /> New Return Entry
            </button>
          </div>
        </div>
      )}

      {view === 'list' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20, marginBottom: 24 }}>
            {stats.map(stat => (
              <div key={stat.label} className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
                <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-details">
                  <h3>{stat.label}</h3>
                  <div className="value">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
            {/* Search Card */}
            <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" placeholder="Search Return No or Employee…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
                {loading && <Loader2 className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <Filter size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
                </div>
                <select className="form-control" style={{ width: 150, margin: 0 }}>
                  <option>All Statuses</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
                  <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
                  <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
              <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Return No</th>
                    <th>Return Date</th>
                    <th>Returned By</th>
                    <th>Received By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                  ) : filteredReturns.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No returns logged yet.</td></tr>
                  ) : (
                    filteredReturns.map(r => (
                      <tr 
                        key={r.id}
                        onClick={async () => {
                          const detailedReturn = await storesService.getReturnToStore(r.id);
                          setSelectedViewItem(detailedReturn);
                        }}
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === r.id ? 'var(--bg-secondary)' : 'transparent' }}
                      >
                        <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{r.return_no}</td>
                        <td>{r.return_date ? new Date(r.return_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td style={{ fontWeight: 600 }}>{r.returned_by_name || '-'}</td>
                        <td>{r.received_by_name || '-'}</td>
                        <td>
                          <span className={`status-badge ${r.status?.toLowerCase().replace(' ', '-') || 'received'}`}>
                            {r.status || 'Received'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleEdit(r)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={async () => {
                                const detailedReturn = await storesService.getReturnToStore(r.id);
                                setSelectedViewItem(detailedReturn);
                              }}
                              title="Preview"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button onClick={(e) => handleDelete(r.id, r.return_no, e)} className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Return">
                              <Trash2 size={16} color="var(--danger, #ef4444)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
        </>
      ) : (
        <div className="animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setView('list')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              New Return to Store Entry
            </h2>
          </div>

          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
              <button
                type="button"
                style={{
                  padding: '16px 24px', background: '#fff',
                  border: 'none', borderBottom: '3px solid var(--primary)',
                  fontWeight: 600, color: 'var(--primary)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Return Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Link Issue Reference (optional)</label>
                        <MasterDropdown
                          label=""
                          name="issue_id"
                          value={formData.issue_id}
                          options={issuesList.map(iss => ({ ...iss, name: `${iss.issue_no} — ${iss.requesting_department_name || 'Unknown'}`, id: iss.id.toString() }))}
                          onChange={(name, val) => handleIssueChange(val)}
                        />
                        {linkedIssue && (
                          <p style={{ marginTop: '8px', fontSize: '12px', color: '#ea580c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> {linkedIssue.items?.length || 0} item(s) from issue
                          </p>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Returned By *</label>
                        <MasterDropdown
                          label=""
                          name="returned_by_id"
                          value={formData.returned_by_id}
                          options={employees}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Received By Storekeeper</label>
                        <MasterDropdown
                          label=""
                          name="received_by_id"
                          value={formData.received_by_id}
                          options={employees}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                    </div>

                    {formData.items.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                          <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                            Items Being Returned
                          </h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formData.items.length} item(s)</span>
                        </div>
                        <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
                          <table className="data-table" style={{ width: '100%', marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th>Item</th>
                                <th style={{ textAlign: 'center', width: 140 }}>Qty to Return</th>
                                <th style={{ width: 160 }}>Condition</th>
                                <th>Reason</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.items.map((item, idx) => {
                                const obj = itemsList.find(i => i.id === item.item_id);
                                return (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{obj?.item_name || `Item #${item.item_id}`}</div>
                                      {obj?.item_code && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{obj.item_code}</div>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <input type="number" min="0" value={item.quantity_returned}
                                        onChange={e => setItemField(idx, 'quantity_returned', parseFloat(e.target.value) || 0)}
                                        className="form-control" style={{ width: 100, margin: 0, display: 'inline-block' }} />
                                    </td>
                                    <td>
                                      <MasterDropdown
                                        label=""
                                        name="condition"
                                        value={item.condition}
                                        options={[
                                          { id: 'Good', name: 'Good (Restockable)' },
                                          { id: 'Damaged', name: 'Damaged' },
                                          { id: 'Partial', name: 'Partial' }
                                        ]}
                                        onChange={(name, val) => setItemField(idx, name, val)}
                                      />
                                    </td>
                                    <td>
                                      <input type="text" value={item.reason} onChange={e => setItemField(idx, 'reason', e.target.value)}
                                        placeholder=""
                                        className="form-control" style={{ margin: 0 }} />
                                    </td>
                                    <td>
                                      <input type="text" value={item.remarks} onChange={e => setItemField(idx, 'remarks', e.target.value)}
                                        placeholder=""
                                        className="form-control" style={{ margin: 0 }} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: 'rgba(249, 115, 22, 0.05)', borderTop: '2px solid rgba(249, 115, 22, 0.2)' }}>
                                <td colSpan={2} style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', padding: '12px 16px' }}>Total Qty Returned</td>
                                <td style={{ textAlign: 'center', fontWeight: 800, color: '#c2410c', padding: '12px 16px' }}>{formData.items.reduce((s, i) => s + (i.quantity_returned || 0), 0)} units</td>
                                <td colSpan={3} />
                              </tr>
                            </tfoot>
                          </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '1px dashed var(--border)', borderRadius: 12, marginTop: 24, background: 'var(--bg-secondary)' }}>
                        <RotateCcw size={36} style={{ color: 'var(--text-muted)' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Select an issue reference above to auto-fill items, or they will be added manually.</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitLoading || !formData.returned_by_id}>
                        Save
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Return to Store Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>

                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>RETURN TO STORE</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                <div style={{ padding: '10px 40px 40px 40px' }}>
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(10, 20).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Dinesh Exports</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@dineshexports.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.dineshexports.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                      <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420,
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    await storesService.deleteReturnToStore(id);
                    showToast("Return deleted successfully.");
                    loadData();
                    if (typeof setSelectedViewItem === 'function' && selectedViewItem?.id === id) setSelectedViewItem(null);
                  } catch (err) {
                    showToast("Error deleting return. It may be in use.", 'error');
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

