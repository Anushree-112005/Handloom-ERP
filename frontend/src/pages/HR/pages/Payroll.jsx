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

  const handleEmployeeChange = async (employeeValue) => {
    if (!employeeValue) {
      setForm(prev => ({
        ...prev,
        employee: '',
        basic: 0,
        allowances: 0,
        deductions: 0,
        lop_days: 0,
        ot_hours: 0
      }));
      return;
    }

    const selectedEmp = employees.find(
      emp => String(emp.employee_id) === String(employeeValue) || String(emp.id) === String(employeeValue)
    );

    if (selectedEmp) {
      const empId = selectedEmp.id;
      const empCode = selectedEmp.employee_id;
      
      setForm(prev => ({
        ...prev,
        employee: employeeValue,
        basic: selectedEmp.basic_salary || 0,
        allowances: selectedEmp.allowances || 0,
        deductions: selectedEmp.deductions || 0,
        lop_days: 0,
        ot_hours: 0
      }));

      try {
        const [attData, leavesData] = await Promise.all([
          hrService.fetchEmployeeAttendance(employeeValue).catch(() => []),
          hrService.fetchEmployeeLeaves(employeeValue).catch(() => [])
        ]);

        let attLop = attData.reduce((sum, att) => sum + (Number(att.lop_days) || 0), 0);
        let attOt = attData.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);

        if (attData.length === 0) {
          const fallbackId = selectedEmp.id;
          const attDataById = await hrService.fetchEmployeeAttendance(fallbackId).catch(() => []);
          if (attDataById.length > 0) {
            attLop = attDataById.reduce((sum, att) => sum + (Number(att.lop_days) || 0), 0);
            attOt = attDataById.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);
          } else if (selectedEmp.employee_id) {
            const attDataByCode = await hrService.fetchEmployeeAttendance(selectedEmp.employee_id).catch(() => []);
            attLop = attDataByCode.reduce((sum, att) => sum + (Number(att.lop_days) || 0), 0);
            attOt = attDataByCode.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);
          }
        }

        setForm(prev => ({
          ...prev,
          lop_days: attLop,
          ot_hours: attOt
        }));
      } catch (err) {
        console.error("Error fetching employee details:", err);
      }
    } else {
      setForm(prev => ({ ...prev, employee: employeeValue }));
    }
  };

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
    <div className="animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 'calc(100vh - 80px)' }}>

      {!showForm && (
        <>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Calculator size={24} color="var(--primary)" /> Payroll Management
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Calculate employee salaries, manage allowances and deductions, and run AI error detection.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Net Pay Badge */}
          <span style={{ 
            backgroundColor: '#10b98118', 
            color: '#047857', 
            padding: '6px 12px', 
            borderRadius: 6, 
            fontSize: 13, 
            fontWeight: 600,
            border: '1px solid #10b98130',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <DollarSign size={14} /> Net: ₹{totals.net.toLocaleString()}
          </span>

          {totals.pending > 0 && (
            <span style={{ 
              backgroundColor: '#f59e0b18', 
              color: '#b45309', 
              padding: '6px 12px', 
              borderRadius: 6, 
              fontSize: 13, 
              fontWeight: 600,
              border: '1px solid #f59e0b30'
            }}>
              {totals.pending} Pending
            </span>
          )}

          {/* AI Detect Errors Button */}
          <button
            onClick={handleAIDetectErrors}
            disabled={isDetecting || rows.length === 0}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', color: 'var(--primary)', borderColor: 'var(--primary)' }}
          >
            <Sparkles className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            {isDetecting ? 'Analyzing...' : 'AI Detect Errors'}
          </button>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
            >
              <Filter className="w-4 h-4" /> Filter
              {(filterStatus || filterPeriod) && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />}
            </button>
            {showFilters && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 16, zIndex: 100, minWidth: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filters</span>
                  <button onClick={() => { setFilterStatus(''); setFilterPeriod(''); }} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-control">
                      <option value="">All Status</option>
                      <option value="Pending HR">Pending HR</option>
                      <option value="Pending Finance">Pending Finance</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Period</label>
                    <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="form-control">
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
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
            <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', background: viewMode === 'list' ? '#fff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', background: viewMode === 'grid' ? '#fff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Add Button */}
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
            <Plus className="w-4 h-4" /> Add Payroll Entry
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Messages */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#ecfdf5', border: '1px solid #10b98130', color: '#047857', borderRadius: 8, marginBottom: 16 }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> <span style={{ fontSize: 14, fontWeight: 500 }}>{success}</span>
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fef2f2', border: '1px solid #ef444430', color: '#991b1b', borderRadius: 8, marginBottom: 16 }}>
            <AlertTriangle className="w-4 h-4 text-red-600" /> <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && rows.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Add Entry Form will be moved outside */}

        {/* View Payslip Modal */}
        {viewingPayslip && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
            <div className="card" style={{ width: '100%', maxWidth: 500, padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Payslip Details</h2>
                <button onClick={() => setViewingPayslip(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6" ref={payslipRef}>
                <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'inline-flex', padding: 12, background: '#10b98118', borderRadius: '50%', color: '#10b981', marginBottom: 12 }}>
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                    {employees.find(e => e.employee_id === viewingPayslip.employee || e.id === parseInt(viewingPayslip.employee))?.name || viewingPayslip.employee}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Employee ID: {viewingPayslip.employee}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{viewingPayslip.period}</p>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 12,
                    backgroundColor: viewingPayslip.status === 'Approved' ? '#10b98118' : viewingPayslip.status === 'Pending Finance' ? '#3b82f618' : '#f59e0b18',
                    color: viewingPayslip.status === 'Approved' ? '#047857' : viewingPayslip.status === 'Pending Finance' ? '#1d4ed8' : '#b45309'
                  }}>{viewingPayslip.status}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Basic</span><span className="font-semibold text-slate-800">₹{(viewingPayslip.basic || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Allowances</span><span className="font-semibold text-slate-800">₹{(viewingPayslip.allowances || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">OT ({viewingPayslip.ot_hours || 0}h × ₹200)</span><span className="font-semibold text-slate-800">₹{((viewingPayslip.ot_hours || 0) * 200).toLocaleString()}</span></div>
                  <div className="flex justify-between text-emerald-600 font-semibold border-t pt-3"><span>Gross</span><span>₹{computeSalary(viewingPayslip).gross.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="font-semibold text-red-600">-₹{(viewingPayslip.deductions || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">LOP ({viewingPayslip.lop_days || 0}d)</span><span className="font-semibold text-red-600">-₹{Math.round(((viewingPayslip.basic || 0) / 26) * (viewingPayslip.lop_days || 0)).toLocaleString()}</span></div>
                  <div className="flex justify-between text-xl font-bold text-emerald-600 border-t pt-3"><span>Net Pay</span><span>₹{computeSalary(viewingPayslip).net.toLocaleString()}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button onClick={handleDownloadPDF} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ef4444', borderColor: '#ef4444' }}>
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                  <button onClick={handleDownloadExcel} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', borderColor: '#10b981' }}>
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Cards - List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredRows.length === 0 && !loading ? (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500" style={{ margin: 0 }}>No payroll entries yet</p>
              </div>
            ) : filteredRows.map((r) => {
              const salary = computeSalary(r);
              const empName = employees.find(e => e.employee_id === r.employee || e.id === parseInt(r.employee))?.name || r.employee;
              return (
                <div key={r.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, background: '#10b98118', borderRadius: 8, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{empName}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>ID: {r.employee} • {r.period}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={{ 
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: r.status === 'Approved' ? '#10b98118' : r.status === 'Pending Finance' ? '#3b82f618' : '#f59e0b18',
                        color: r.status === 'Approved' ? '#047857' : r.status === 'Pending Finance' ? '#1d4ed8' : '#b45309'
                      }}>{r.status}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>₹{salary.net.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', itemsCenter: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 4 }}>Basic: ₹{(r.basic || 0).toLocaleString()}</span>
                    {r.allowances > 0 && <span style={{ background: '#10b98110', color: '#047857', padding: '4px 8px', borderRadius: 4 }}>Allowances: +₹{r.allowances.toLocaleString()}</span>}
                    {r.deductions > 0 && <span style={{ background: '#ef444410', color: '#b91c1c', padding: '4px 8px', borderRadius: 4 }}>Deductions: -₹{r.deductions.toLocaleString()}</span>}
                    {r.ot_hours > 0 && <span style={{ background: '#3b82f610', color: '#1d4ed8', padding: '4px 8px', borderRadius: 4 }}>OT: {r.ot_hours}h</span>}
                    {r.lop_days > 0 && <span style={{ background: '#f59e0b10', color: '#b45309', padding: '4px 8px', borderRadius: 4 }}>LOP: {r.lop_days}d</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <button onClick={() => setViewingPayslip(r)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
                      <Eye className="w-4 h-4" /> View Payslip
                    </button>
                    {r.status === 'Pending HR' && (
                      <button onClick={() => approve(r.id, 'Pending Finance')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                        HR Approve
                      </button>
                    )}
                    {r.status === 'Pending Finance' && (
                      <button onClick={() => approve(r.id, 'Approved')} className="btn btn-success" style={{ padding: '8px 16px', fontSize: 13, background: '#10b981', borderColor: '#10b981' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredRows.length === 0 && !loading ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500" style={{ margin: 0 }}>No payroll entries yet</p>
              </div>
            ) : filteredRows.map((r) => {
              const salary = computeSalary(r);
              const empName = employees.find(e => e.employee_id === r.employee || e.id === parseInt(r.employee))?.name || r.employee;
              return (
                <div key={r.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', itemsCenter: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 36, height: 36, background: '#10b98118', borderRadius: 8, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empName}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>ID: {r.employee} • {r.period}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2" style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Basic</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{(r.basic || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Net Pay</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>₹{salary.net.toLocaleString()}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: r.status === 'Approved' ? '#10b98118' : r.status === 'Pending Finance' ? '#3b82f618' : '#f59e0b18',
                          color: r.status === 'Approved' ? '#047857' : r.status === 'Pending Finance' ? '#1d4ed8' : '#b45309'
                        }}>{r.status}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <button onClick={() => setViewingPayslip(r)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', fontSize: 12, flex: 1 }}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {r.status === 'Pending HR' && (
                      <button onClick={() => approve(r.id, 'Pending Finance')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, flex: 1, justifyContent: 'center' }}>
                        Approve
                      </button>
                    )}
                    {r.status === 'Pending Finance' && (
                      <button onClick={() => approve(r.id, 'Approved')} className="btn btn-success" style={{ padding: '6px 12px', fontSize: 12, flex: 1, justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }}>
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>{/* END DATA AREA */}
      </>
      )}

      {/* Add Entry Form Inline */}
      {showForm && (
        <form className="card" style={{ padding: 0 }} onSubmit={addRow}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Add Payroll Entry</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X className="w-4 h-4" /> Close
              </button>
              <button onClick={(e) => addRow(e)} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus className="w-4 h-4" /> {loading ? 'Saving...' : 'Add Entry'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="form-group">
              <label>Employee *</label>
              <select className="form-control"
                value={form.employee} onChange={(e) => handleEmployeeChange(e.target.value)} required>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.employee_id || emp.id}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Period</label>
                <select className="form-control"
                  value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  <option>Monthly</option><option>Weekly</option><option>Bi-Weekly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Basic Salary *</label>
                <input type="number" min="0" className="form-control"
                  value={form.basic} onChange={(e) => setForm({ ...form, basic: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Allowances</label>
                <input type="number" min="0" className="form-control"
                  value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Deductions</label>
                <input type="number" min="0" className="form-control"
                  value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>LOP Days</label>
                <input type="number" step="0.5" min="0" className="form-control"
                  value={form.lop_days} onChange={(e) => setForm({ ...form, lop_days: e.target.value })} />
              </div>
              <div className="form-group">
                <label>OT Hours</label>
                <input type="number" min="0" className="form-control"
                  value={form.ot_hours} onChange={(e) => setForm({ ...form, ot_hours: e.target.value })} />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Gross</span><span className="font-semibold text-slate-800">₹{computeSalary(form).gross.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="font-semibold text-red-600">-₹{computeSalary(form).deductions.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: 8 }}><span className="font-bold text-slate-700">Net Pay</span><span className="font-bold text-emerald-600 text-base">₹{computeSalary(form).net.toLocaleString()}</span></div>
            </div>
          </div>
        </form>
      )}
      
      {/* AI Anomalies Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card" style={{ width: '100%', maxWidth: 600, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 8, background: 'rgba(79, 70, 229, 0.1)', borderRadius: 8, color: 'var(--primary)' }}>
                  <Sparkles size={18} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>AI Payroll Error Detection</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
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
                    <div key={idx} className="card" style={{ padding: 16, borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.02)', display: 'flex', gap: 12 }}>
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