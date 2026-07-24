import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Eye, Printer, Search, Download, FileText, ArrowLeft, Wallet, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { orderExpenseAPI, buyerOrderAPI, dropdownAPI } from '../../services/api';
import SubMasterDropdown from '../../components/SubMasterDropdown';

// Mock Data
// MOCK_IBPOS removed

const MOCK_EXPENSE_TYPES = ['Freight', 'Commission', 'Testing Charges', 'Courier', 'Miscellaneous'];
const MOCK_UNITS = ['Kgs', 'Mtrs', 'Pcs', 'Lumps', 'Fixed'];

export default function OrderExpenses() {
  const [showForm, setShowForm] = useState(false);
  const [expensesHistory, setExpensesHistory] = useState([]);
  const [mainSearch, setMainSearch] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [options, setOptions] = useState({});

  useEffect(() => {
    fetchExpenses();
    fetchBuyerOrders();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const res = await dropdownAPI.getAll();
      setOptions(res.data || {});
    } catch (e) {
      console.error('Failed to fetch options', e);
    }
  };

  const refreshDropdownOptions = () => fetchOptions();

  const fetchBuyerOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrders(res.data || []);
    } catch (e) {
      console.error('Failed to fetch buyer orders', e);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await orderExpenseAPI.list();
      setExpensesHistory(res.data || []);
    } catch (e) {
      console.error('Failed to fetch expenses', e);
    }
  };

  const [form, setForm] = useState({
    reference_no: '',
    date: new Date().toISOString().split('T')[0],
    ibpo_number: '',
    ibpo_date: '',
    party_name: '',
    quality: '',
    order_mtr: 0,
    fabric_type: '',
    order_type: '',
    merchandiser: ''
  });

  const [expenseRows, setExpenseRows] = useState([
    { id: Date.now(), expense_type: '', remarks: '', quantity: 0, unit: 'Fixed', rate: 0, amount: 0 }
  ]);

  const [isReadOnly, setIsReadOnly] = useState(false);

  // Handle IBPO Selection
  const handleIbpoChange = (e) => {
    const selectedIbpo = e.target.value;
    const ibpoData = buyerOrders.find(ibpo => ibpo.ibpo_number === selectedIbpo);

    if (ibpoData) {
      const orderMtr = ibpoData.items?.reduce((sum, i) => sum + (parseFloat(i.order_mtrs) || 0), 0) || 0;
      const qualityStr = ibpoData.items?.map(i => i.fabric_type || '').filter(Boolean).join(', ') || '';
      const weaveStr = ibpoData.items?.map(i => i.weaving_type || '').filter(Boolean).join(', ') || '';

      setForm(prev => ({
        ...prev,
        ibpo_number: selectedIbpo,
        ibpo_date: ibpoData.order_date ? ibpoData.order_date.substring(0, 10) : '',
        party_name: ibpoData.party_name || '',
        quality: qualityStr,
        order_mtr: orderMtr,
        fabric_type: weaveStr,
        order_type: ibpoData.order_type || '',
        merchandiser: ibpoData.merchandiser || ''
      }));
    } else {
      setForm(prev => ({
        ...prev,
        ibpo_number: selectedIbpo,
        ibpo_date: '',
        party_name: '',
        quality: '',
        order_mtr: 0,
        fabric_type: '',
        order_type: '',
        merchandiser: ''
      }));
    }
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle Expense Table
  const addExpenseRow = () => {
    setExpenseRows([
      ...expenseRows,
      { id: Date.now(), expense_type: '', remarks: '', quantity: 0, unit: 'Fixed', rate: 0, amount: 0 }
    ]);
  };

  const removeExpenseRow = (id) => {
    setExpenseRows(expenseRows.filter(row => row.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setExpenseRows(expenseRows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };

        // Auto calculate amount
        if (field === 'quantity' || field === 'rate') {
          const qty = field === 'quantity' ? (parseFloat(value) || 0) : row.quantity;
          const rate = field === 'rate' ? (parseFloat(value) || 0) : row.rate;
          updatedRow.amount = parseFloat((qty * rate).toFixed(2));
        }

        return updatedRow;
      }
      return row;
    }));
  };

  // Calculate Summary
  const totalMtr = expenseRows.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);
  const netAmount = expenseRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  // Actions
  const handleOpenForm = (readOnly = false) => {
    setForm({
      reference_no: `EXP-${Math.floor(Math.random() * 90000) + 10000}`,
      date: new Date().toISOString().split('T')[0],
      ibpo_number: '',
      ibpo_date: '',
      party_name: '',
      quality: '',
      order_mtr: 0,
      fabric_type: '',
      order_type: '',
      merchandiser: ''
    });
    setExpenseRows([{ id: Date.now(), expense_type: '', remarks: '', quantity: 0, unit: 'Fixed', rate: 0, amount: 0 }]);
    setIsReadOnly(readOnly);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.ibpo_number) {
      alert("IBPO Number is mandatory.");
      return;
    }
    if (!form.date) {
      alert("Date is mandatory.");
      return;
    }
    if (expenseRows.length === 0) {
      alert("Please add at least one expense entry.");
      return;
    }
    const invalidRow = expenseRows.find(r => !r.expense_type || r.quantity <= 0 || r.rate < 0);
    if (invalidRow) {
      alert("All expense rows must have an Expense Type, Quantity > 0, and Rate >= 0.");
      return;
    }

    const payload = {
      reference_no: form.reference_no,
      date: form.date,
      ibpo_number: form.ibpo_number,
      ibpo_date: form.ibpo_date || null,
      party_name: form.party_name,
      quality: form.quality,
      order_mtr: form.order_mtr || 0,
      fabric_type: form.fabric_type,
      order_type: form.order_type,
      merchandiser: form.merchandiser,
      net_amount: netAmount,
      entries: expenseRows.map(r => ({
        expense_type: r.expense_type,
        remarks: r.remarks,
        quantity: parseFloat(r.quantity) || 0,
        unit: r.unit,
        rate: parseFloat(r.rate) || 0,
        amount: parseFloat(r.amount) || 0
      }))
    };

    orderExpenseAPI.create(payload)
      .then(() => {
        fetchExpenses();
        alert("Order Expenses saved successfully!");
        setShowForm(false);
      })
      .catch(e => {
        console.error('Failed to save expenses', e);
        alert('Failed to save expenses.');
      });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Order Expenses Report", 14, 15);
    autoTable(doc, {
      head: [["Ref No", "Date", "IBPO No", "Party", "Net Amount"]],
      body: expensesHistory.map(c => [c.reference_no, c.date, c.ibpo_number, c.party_name, c.net_amount.toFixed(2)]),
      startY: 20
    });
    doc.save(`Order_Expenses_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(expensesHistory);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `Order_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredHistory = expensesHistory.filter(h =>
    h.reference_no.toLowerCase().includes(mainSearch.toLowerCase()) ||
    h.ibpo_number.toLowerCase().includes(mainSearch.toLowerCase()) ||
    h.party_name.toLowerCase().includes(mainSearch.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {!showForm ? (
        // --- MAIN LIST VIEW ---
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={24} color="var(--primary)" /> Order Expenses
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage and track expenses recorded against IBPOs.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Export
                </button>
                {showExportMenu && (
                  <>
                    <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                      <button onClick={() => { setShowExportMenu(false); exportPDF(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FileText size={16} color="#ef4444" /> PDF Report
                      </button>
                      <button onClick={() => { setShowExportMenu(false); exportExcel(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Download size={16} color="#10b981" /> Excel Sheet
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => handleOpenForm(false)}>
                <Plus size={16} /> New Order Expense
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Total Expense Records</h3><div className="value">
                {expensesHistory.length}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><DollarSign size={24} /></div>
              <div className="stat-details"><h3>Total Amount Spent</h3><div className="value">
                ₹ {expensesHistory.reduce((acc, curr) => acc + (parseFloat(curr.net_amount) || 0), 0).toFixed(2)}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><TrendingUp size={24} /></div>
              <div className="stat-details"><h3>Avg Expense per Order</h3><div className="value">
                ₹ {expensesHistory.length > 0 ? (expensesHistory.reduce((acc, curr) => acc + (parseFloat(curr.net_amount) || 0), 0) / expensesHistory.length).toFixed(2) : '0.00'}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><Activity size={24} /></div>
              <div className="stat-details"><h3>Active IBPOs Tracked</h3><div className="value">
                {new Set(expensesHistory.map(h => h.ibpo_number)).size}
              </div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search expenses..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={mainSearch} onChange={e => setMainSearch(e.target.value)} />
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref No</th>
                    <th>Date</th>
                    <th>IBPO No</th>
                    <th>Party Name</th>
                    <th style={{ textAlign: 'right' }}>Net Amount</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No expenses found. Click "New Order Expense" to create one.</td></tr>
                  ) : filteredHistory.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{h.reference_no}</td>
                      <td>{h.date}</td>
                      <td>{h.ibpo_number}</td>
                      <td>{h.party_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹ {(parseFloat(h.net_amount) || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px' }} title="View">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // --- FORM VIEW ---
        <div className="card" style={{ padding: 0 }}>
          {/* Form Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                Order Expenses Form
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 13 }}>
                Entry Against IBPO
              </p>
            </div>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>

              {/* SECTION 1: Expense Information */}
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Expense Information</h4>

              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label>Reference No *</label>
                  <input type="text" className="form-control" name="reference_no" value={form.reference_no} disabled style={{ background: '#f1f5f9', fontWeight: 'bold' }} />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" className="form-control" name="date" value={form.date} onChange={handleFormChange} required />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>IBPO Number *</label>
                  <select className="form-control" name="ibpo_number" value={form.ibpo_number} onChange={handleIbpoChange} required>
                    <option value="">Select IBPO...</option>
                    {buyerOrders.map(ibpo => (
                      <option key={ibpo.id} value={ibpo.ibpo_number}>{ibpo.ibpo_number}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>IBPO Date</label>
                  <input type="date" className="form-control" name="ibpo_date" value={form.ibpo_date} onChange={handleFormChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Party Name</label>
                  <input type="text" className="form-control" name="party_name" value={form.party_name} onChange={handleFormChange} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Quality (Finished)</label>
                  <input type="text" className="form-control" name="quality" value={form.quality} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Order MTR</label>
                  <input type="number" className="form-control" name="order_mtr" value={form.order_mtr} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Fabric Type</label>
                  <input type="text" className="form-control" name="fabric_type" value={form.fabric_type} onChange={handleFormChange} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Order Type</label>
                  <input type="text" className="form-control" name="order_type" value={form.order_type} onChange={handleFormChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Merchandiser</label>
                  <input type="text" className="form-control" name="merchandiser" value={form.merchandiser} onChange={handleFormChange} />
                </div>
              </div>

              {/* SECTION 2: Expense Entry */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Expense Entry</h4>
                <button type="button" className="btn btn-primary" onClick={addExpenseRow} style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Add Expense Row
                </button>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflowX: 'auto', marginBottom: 24 }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 50, textAlign: 'center' }}>S.No</th>
                      <th style={{ width: 200 }}>Expense Type</th>
                      <th>Remarks</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Quantity</th>
                      <th style={{ width: 120 }}>Unit</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Rate</th>
                      <th style={{ width: 150, textAlign: 'right' }}>Amount</th>
                      <th style={{ width: 60, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseRows.map((row, index) => (
                      <tr key={row.id}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ minWidth: 150 }}>
                          <SubMasterDropdown
                            name="expense_type"
                            value={row.expense_type}
                            entity="expense_type_master"
                            category="Expense Type"
                            options={options}
                            onChange={(name, val) => handleRowChange(row.id, 'expense_type', val)}
                            onOptionsRefresh={refreshDropdownOptions}
                            allowCustom={true}
                            disabled={isReadOnly}
                            placeholder="Select Expense Type..."
                          />
                        </td>
                        <td>
                          <input type="text" className="form-control" style={{ margin: 0 }} value={row.remarks} onChange={e => handleRowChange(row.id, 'remarks', e.target.value)} placeholder="Remarks..." />
                        </td>
                        <td>
                          <input type="number" className="form-control" style={{ margin: 0, textAlign: 'right' }} value={row.quantity} onChange={e => handleRowChange(row.id, 'quantity', e.target.value)} min="0" step="any" required />
                        </td>
                        <td style={{ minWidth: 150 }}>
                          <SubMasterDropdown
                            name="unit"
                            value={row.unit}
                            entity="unit_master"
                            category="Unit"
                            options={options}
                            onChange={(name, val) => handleRowChange(row.id, 'unit', val)}
                            onOptionsRefresh={refreshDropdownOptions}
                            allowCustom={true}
                            disabled={isReadOnly}
                            placeholder="Select Unit..."
                          />
                        </td>
                        <td>
                          <input type="number" className="form-control" style={{ margin: 0, textAlign: 'right' }} value={row.rate} onChange={e => handleRowChange(row.id, 'rate', e.target.value)} min="0" step="any" required />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                          {row.amount.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" className="btn btn-secondary" onClick={() => removeExpenseRow(row.id)} style={{ padding: '6px', color: '#ef4444', border: 'none', background: 'transparent' }} title="Delete Row">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expenseRows.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                          No expenses added. Click "Add Expense Row" to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>



            </fieldset>

            {/* Bottom Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              {!isReadOnly && (
                <>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={16} /> Save
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
