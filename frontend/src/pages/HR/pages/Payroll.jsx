import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, FileText, Plus, Trash2, X, DollarSign, Eye, User, Calendar, Building, RefreshCw, Download, Printer, FileSpreadsheet, Filter, LayoutList, LayoutGrid, Sparkles } from 'lucide-react';
import hrService, { fetchPayroll, createPayroll, updatePayroll, fetchEmployees } from '../../../services/hrService';

const initialForm = {
  employee: '', period: 'Monthly',
  basic: 0, allowances: 0, deductions: 0, lop_days: 0, ot_hours: 0
};

const Payroll = () => {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const payslipRef = useRef(null);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiAnomalies, setAiAnomalies] = useState([]);
  const [showAiModal, setShowAiModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payrollData, empData] = await Promise.all([
        fetchPayroll(),
        fetchEmployees()
      ]);
      setRows(payrollData || []);
      setEmployees(empData || []);
    } catch (err) {
      console.error('Failed to load payroll:', err);
      setError('Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const computeSalary = (r) => {
    const gross = (Number(r.basic) || 0) + (Number(r.allowances) || 0) + ((Number(r.ot_hours) || 0) * 200);
    const totalDeductions = (Number(r.deductions) || 0) + (((Number(r.basic) || 0) / 26) * (Number(r.lop_days) || 0));
    return { gross, deductions: totalDeductions, net: gross - totalDeductions };
  };

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterPeriod && row.period !== filterPeriod) return false;
      return true;
    });
  }, [rows, filterStatus, filterPeriod]);

  const totals = useMemo(() => {
    const totalGross = rows.reduce((sum, r) => sum + computeSalary(r).gross, 0);
    const totalDeductions = rows.reduce((sum, r) => sum + computeSalary(r).deductions, 0);
    const totalNet = rows.reduce((sum, r) => sum + computeSalary(r).net, 0);
    const pending = rows.filter(r => r.status !== 'Approved').length;
    return { gross: totalGross, deductions: totalDeductions, net: totalNet, pending };
  }, [rows]);

  const resetForm = () => {
    setForm(initialForm);
    setShowForm(false);
    setError('');
  };

  const addRow = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.employee || !form.basic) {
      setError('Employee and Basic Salary are required');
      return;
    }

    setLoading(true);
    try {
      await createPayroll({
        ...form,
        basic: Number(form.basic),
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
        lop_days: Number(form.lop_days) || 0,
        ot_hours: Number(form.ot_hours) || 0
      });
      setSuccess('Payroll entry added!');
      resetForm();
      await loadData();
    } catch (err) {
      setError('Failed to add payroll entry');
    }
    setLoading(false);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const approve = async (id, newStatus) => {
    setLoading(true);
    try {
      await updatePayroll(id, { status: newStatus });
      setSuccess(`Status updated to ${newStatus}`);
      await loadData();
    } catch (err) {
      setError('Failed to update status');
    }
    setLoading(false);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handlePrint = () => {
    if (!viewingPayslip) return;
    const printWindow = window.open('', '_blank');
    const salary = computeSalary(viewingPayslip);
    const employeeName = employees.find(e => e.employee_id === viewingPayslip.employee || e.id === parseInt(viewingPayslip.employee))?.name || viewingPayslip.employee;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${viewingPayslip.employee}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #1e293b; font-size: 28px; }
          .header p { margin: 5px 0; color: #64748b; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-box { flex: 1; }
          .info-box h3 { margin: 0 0 10px 0; color: #475569; font-size: 14px; text-transform: uppercase; }
          .info-box p { margin: 3px 0; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f1f5f9; padding: 12px; text-align: left; color: #475569; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .amount { text-align: right; font-weight: 600; }
          .total-row { background: #ecfdf5; font-weight: bold; font-size: 18px; }
          .total-row td { color: #10b981; border-top: 2px solid #10b981; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-approved { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAYSLIP</h1>
          <p>Universe Enterprise v2.0</p>
        </div>
        <div class="info-section">
          <div class="info-box">
            <h3>Employee Details</h3>
            <p><strong>Name:</strong> ${employeeName}</p>
            <p><strong>Employee ID:</strong> ${viewingPayslip.employee}</p>
            <p><strong>Period:</strong> ${viewingPayslip.period}</p>
          </div>
          <div class="info-box" style="text-align: right;">
            <h3>Payslip Details</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p><strong>Status:</strong> <span class="status-badge ${viewingPayslip.status === 'Approved' ? 'status-approved' : 'status-pending'}">${viewingPayslip.status}</span></p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Basic Salary</td><td class="amount">${(viewingPayslip.basic || 0).toLocaleString()}</td></tr>
            <tr><td>Allowances</td><td class="amount">${(viewingPayslip.allowances || 0).toLocaleString()}</td></tr>
            <tr><td>Overtime (${viewingPayslip.ot_hours || 0}h × ₹200)</td><td class="amount">${((viewingPayslip.ot_hours || 0) * 200).toLocaleString()}</td></tr>
            <tr style="background: #f8fafc;"><td><strong>Gross Salary</strong></td><td class="amount"><strong>${salary.gross.toLocaleString()}</strong></td></tr>
            <tr><td>Deductions</td><td class="amount" style="color: #dc2626;">-${(viewingPayslip.deductions || 0).toLocaleString()}</td></tr>
            <tr><td>Loss of Pay (${viewingPayslip.lop_days || 0} days)</td><td class="amount" style="color: #dc2626;">-${Math.round(((viewingPayslip.basic || 0) / 26) * (viewingPayslip.lop_days || 0)).toLocaleString()}</td></tr>
            <tr class="total-row"><td>NET PAY</td><td class="amount">₹${salary.net.toLocaleString()}</td></tr>
          </tbody>
        </table>
        <div class="footer">
          <p>This is a computer-generated payslip and does not require a signature.</p>
          <p>© 2026 Universe Enterprise. All rights reserved.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    if (!viewingPayslip) return;
    // Use print functionality which allows Save as PDF
    handlePrint();
    setTimeout(() => {
      alert('Use your browser\'s Print dialog to save as PDF');
    }, 500);
  };

  const handleDownloadExcel = () => {
    if (!viewingPayslip) return;
    const salary = computeSalary(viewingPayslip);
    const employeeName = employees.find(e => e.employee_id === viewingPayslip.employee || e.id === parseInt(viewingPayslip.employee))?.name || viewingPayslip.employee;

    // Create CSV content
    const csvContent = [
      ['PAYSLIP'],
      ['Universe Enterprise v2.0'],
      [''],
      ['Employee Details'],
      ['Name', employeeName],
      ['Employee ID', viewingPayslip.employee],
      ['Period', viewingPayslip.period],
      ['Status', viewingPayslip.status],
      ['Date', new Date().toLocaleDateString('en-IN')],
      [''],
      ['Salary Breakdown'],
      ['Description', 'Amount (₹)'],
      ['Basic Salary', viewingPayslip.basic || 0],
      ['Allowances', viewingPayslip.allowances || 0],
      [`Overtime (${viewingPayslip.ot_hours || 0}h × ₹200)`, (viewingPayslip.ot_hours || 0) * 200],
      ['Gross Salary', salary.gross],
      ['Deductions', `-${viewingPayslip.deductions || 0}`],
      [`Loss of Pay (${viewingPayslip.lop_days || 0} days)`, `-${Math.round(((viewingPayslip.basic || 0) / 26) * (viewingPayslip.lop_days || 0))}`],
      ['NET PAY', salary.net]
    ].map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Payslip_${viewingPayslip.employee}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAIDetectErrors = async () => {
    setIsDetecting(true);
    setAiAnomalies([]);
    try {
      const dataToAnalyze = rows.map(r => ({
        id: r.id,
        employee_id: r.employee,
        period: r.period,
        basic: r.basic,
        allowances: r.allowances,
        deductions: r.deductions,
        ot_hours: r.ot_hours,
        lop_days: r.lop_days,
        net: computeSalary(r).net
      }));
      const res = await hrService.detectPayrollErrors(dataToAnalyze);
      if (res.anomalies) {
        setAiAnomalies(res.anomalies);
        setShowAiModal(true);
      } else {
        setSuccess('No anomalies detected by AI.');
      }
    } catch (err) {
      console.error(err);
      setError('AI Error Detection failed. Check backend configuration.');
    }
    setIsDetecting(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + badges */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">PAYROLL</h1>
          <span className="btn btn-success">
            Net: ₹{totals.net.toLocaleString()}
          </span>
          {totals.pending > 0 && (
            <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-100">
              {totals.pending} Pending
            </span>
          )}
        </div>

        {/* RIGHT: Filter dropdown + view toggle + Add button */}
        <div className="flex items-center gap-2">
          
          {/* AI Detect Errors Button */}
          <button
            onClick={handleAIDetectErrors}
            disabled={isDetecting || rows.length === 0}
            className="btn btn-primary"
          >
            <Sparkles className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            {isDetecting ? 'Analyzing...' : 'AI Detect Errors'}
          </button>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
                }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {(filterStatus || filterPeriod) && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => { setFilterStatus(''); setFilterPeriod(''); }} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control">
                      <option value="">All Status</option>
                      <option value="Pending HR">Pending HR</option>
                      <option value="Pending Finance">Pending Finance</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Period</label>
                    <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
                      className="form-control">
                      <option value="">All Periods</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="btn btn-secondary">
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>

          <button onClick={() => setShowForm(true)}
            className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Payroll Entry
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Messages */}
        {success && (
          <div className="btn btn-success">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="btn btn-danger">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && rows.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Add Entry Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
            <div className="card">
              <div className="btn btn-secondary">
                <h2 className="card-title">Add Payroll Entry</h2>
                <button onClick={resetForm} className="btn btn-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={addRow} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                  <select className="form-control"
                    value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required>
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.employee_id || emp.id}>
                        {emp.name} ({emp.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                    <select className="form-control"
                      value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                      <option>Monthly</option><option>Weekly</option><option>Bi-Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Basic Salary *</label>
                    <input type="number" min="0" className="form-control"
                      value={form.basic} onChange={(e) => setForm({ ...form, basic: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Allowances</label>
                    <input type="number" min="0" className="form-control"
                      value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deductions</label>
                    <input type="number" min="0" className="form-control"
                      value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">LOP Days</label>
                    <input type="number" step="0.5" min="0" className="form-control"
                      value={form.lop_days} onChange={(e) => setForm({ ...form, lop_days: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">OT Hours</label>
                    <input type="number" min="0" className="form-control"
                      value={form.ot_hours} onChange={(e) => setForm({ ...form, ot_hours: e.target.value })} />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Gross</span><span className="font-medium">₹{computeSalary(form).gross.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Deductions</span><span className="font-medium text-red-600">-₹{computeSalary(form).deductions.toLocaleString()}</span></div>
                  <div className="btn btn-secondary"><span className="font-medium">Net Pay</span><span className="font-bold text-emerald-600">₹{computeSalary(form).net.toLocaleString()}</span></div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={resetForm}
                    className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={loading}
                    className="btn btn-primary">
                    {loading ? 'Saving...' : 'Add Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Payslip Modal */}
        {viewingPayslip && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
            <div className="card">
              <div className="btn btn-secondary">
                <h2 className="card-title">Payslip Details</h2>
                <button onClick={() => setViewingPayslip(null)} className="btn btn-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-4" ref={payslipRef}>
                <div className="text-center pb-4 border-b">
                  <div className="btn btn-success">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="card-title">{employees.find(e => e.employee_id === viewingPayslip.employee || e.id === parseInt(viewingPayslip.employee))?.name || viewingPayslip.employee}</h3>
                  <p className="text-xs text-slate-500">Employee ID: {viewingPayslip.employee}</p>
                  <p className="text-sm text-slate-500 mt-1">{viewingPayslip.period}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs mt-2 ${viewingPayslip.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      viewingPayslip.status === 'Pending Finance' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                    }`}>{viewingPayslip.status}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Basic</span><span className="font-medium">₹{(viewingPayslip.basic || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Allowances</span><span className="font-medium">₹{(viewingPayslip.allowances || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">OT ({viewingPayslip.ot_hours || 0}h × ₹200)</span><span className="font-medium">₹{((viewingPayslip.ot_hours || 0) * 200).toLocaleString()}</span></div>
                  <div className="flex justify-between text-emerald-600 font-medium border-t pt-2"><span>Gross</span><span>₹{computeSalary(viewingPayslip).gross.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="font-medium text-red-600">-₹{(viewingPayslip.deductions || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">LOP ({viewingPayslip.lop_days || 0}d)</span><span className="font-medium text-red-600">-₹{Math.round(((viewingPayslip.basic || 0) / 26) * (viewingPayslip.lop_days || 0)).toLocaleString()}</span></div>
                  <div className="flex justify-between text-lg font-bold text-emerald-600 border-t pt-2"><span>Net Pay</span><span>₹{computeSalary(viewingPayslip).net.toLocaleString()}</span></div>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <button onClick={handlePrint} className="btn btn-secondary">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button onClick={handleDownloadPDF} className="btn btn-danger">
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                  <button onClick={handleDownloadExcel} className="btn btn-success">
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Cards - List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredRows.length === 0 && !loading ? (
              <div className="card">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No payroll entries yet</p>
              </div>
            ) : filteredRows.map((r) => {
              const salary = computeSalary(r);
              return (
                <div key={r.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="btn btn-success">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{r.employee}</p>
                        <p className="text-sm text-slate-500">{r.period}</p>
                        <p className="text-lg font-bold text-emerald-600">₹{salary.net.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'Pending Finance' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>{r.status}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">Basic: ₹{(r.basic || 0).toLocaleString()}</span>
                    {r.allowances > 0 && <span className="btn btn-success">+₹{r.allowances.toLocaleString()}</span>}
                    {r.deductions > 0 && <span className="btn btn-danger">-₹{r.deductions.toLocaleString()}</span>}
                    {r.ot_hours > 0 && <span className="btn btn-primary">OT: {r.ot_hours}h</span>}
                    {r.lop_days > 0 && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">LOP: {r.lop_days}d</span>}
                  </div>
                  <div className="btn btn-secondary">
                    <button onClick={() => setViewingPayslip(r)}
                      className="btn btn-secondary">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    {r.status === 'Pending HR' && (
                      <button onClick={() => approve(r.id, 'Pending Finance')}
                        className="btn btn-primary">
                        HR Approve
                      </button>
                    )}
                    {r.status === 'Pending Finance' && (
                      <button onClick={() => approve(r.id, 'Approved')}
                        className="btn btn-success">
                        Finance Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payroll Cards - Grid View */}
        {viewMode === 'grid' && (
          <div className="form-row">
            {filteredRows.length === 0 && !loading ? (
              <div className="btn btn-secondary">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No payroll entries yet</p>
              </div>
            ) : filteredRows.map((r) => {
              const salary = computeSalary(r);
              return (
                <div key={r.id} className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="btn btn-success">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{r.employee}</p>
                      <p className="text-xs text-slate-500">{r.period}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Basic</span>
                      <span className="font-medium">₹{(r.basic || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Net Pay</span>
                      <span className="font-bold text-emerald-600">₹{salary.net.toLocaleString()}</span>
                    </div>
                    <div className="btn btn-secondary">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'Pending Finance' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>{r.status}</span>
                    </div>
                  </div>
                  <div className="btn btn-secondary">
                    <button onClick={() => setViewingPayslip(r)}
                      className="btn btn-secondary">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    {r.status === 'Pending HR' && (
                      <button onClick={() => approve(r.id, 'Pending Finance')}
                        className="btn btn-primary">
                        HR
                      </button>
                    )}
                    {r.status === 'Pending Finance' && (
                      <button onClick={() => approve(r.id, 'Approved')}
                        className="btn btn-success">
                        Fin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>{/* END DATA AREA */}
      
      {/* AI AI Anomalies Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card">
            <div className="btn btn-secondary">
              <div className="flex items-center gap-3">
                <div className="btn btn-primary">
                  <Sparkles size={16} />
                </div>
                <h2 className="card-title">AI Payroll Error Detection</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {aiAnomalies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No payroll anomalies detected.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiAnomalies.map((item, idx) => (
                    <div key={idx} className="btn btn-danger">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm mb-1">Employee ID: {item.employee_id}</p>
                        <p className="text-slate-600 text-sm mb-2">{item.anomaly}</p>
                        <div className="flex gap-4 text-xs">
                          <span className="font-medium text-red-700">Confidence: {item.confidence}%</span>
                          <span className="font-medium text-slate-500">Action: {item.recommended_action}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payroll;