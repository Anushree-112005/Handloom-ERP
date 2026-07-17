import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, FileText, Plus, Trash2, X, DollarSign, Eye, User, Calendar, Building, RefreshCw, Download, Printer, FileSpreadsheet, Filter, LayoutList, LayoutGrid, Sparkles, Search, Edit2 } from 'lucide-react';
import hrService, { fetchPayroll, createPayroll, updatePayroll, deletePayroll, fetchLoans, fetchEmployees } from '../../../services/hrService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const initialForm = {
  employee: '', period: 'Monthly', month: monthsList[new Date().getMonth()],
  basic: 0, allowances: 0, deductions: 0, lop_days: 0, ot_hours: 0, loan_amount: 0
};

const Payroll = () => {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);
  const payslipRef = useRef(null);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiAnomalies, setAiAnomalies] = useState([]);
  const [showAiModal, setShowAiModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payrollData, empData, loanData] = await Promise.all([
        fetchPayroll(),
        fetchEmployees(),
        fetchLoans().catch(() => [])
      ]);
      setRows(payrollData || []);
      setEmployees(empData || []);
      setLoans(loanData || []);
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
    const totalDeductions = (Number(r.deductions) || 0) + (((Number(r.basic) || 0) / 26) * (Number(r.lop_days) || 0)) + (Number(r.loan_amount) || 0);
    return { gross, deductions: totalDeductions, net: gross - totalDeductions };
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll entry?')) return;
    try {
      await deletePayroll(id);
      setSuccess('Payroll entry deleted successfully.');
      setViewingPayslip(null);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete payroll entry.');
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const empName = employees.find(e => e.employee_id === row.employee || e.id === parseInt(row.employee))?.name || row.employee;
      const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) || row.employee.toLowerCase().includes(searchTerm.toLowerCase());
      if (searchTerm && !matchesSearch) return false;
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterPeriod && row.period !== filterPeriod) return false;
      return true;
    });
  }, [rows, filterStatus, filterPeriod, searchTerm, employees]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totals = useMemo(() => {
    const totalGross = rows.reduce((sum, r) => sum + computeSalary(r).gross, 0);
    const totalDeductions = rows.reduce((sum, r) => sum + computeSalary(r).deductions, 0);
    const totalNet = rows.reduce((sum, r) => sum + computeSalary(r).net, 0);
    const pending = rows.filter(r => r.status !== 'Approved').length;
    return { gross: totalGross, deductions: totalDeductions, net: totalNet, pending };
  }, [rows]);

  const handleEmployeeChange = (employeeValue) => {
    if (!employeeValue) {
      setForm(prev => ({
        ...prev,
        employee: '',
        basic: 0,
        allowances: 0,
        deductions: 0,
        lop_days: 0,
        ot_hours: 0,
        loan_amount: 0
      }));
      return;
    }

    const selectedEmp = employees.find(
      emp => String(emp.employee_id) === String(employeeValue) || String(emp.id) === String(employeeValue)
    );

    if (selectedEmp) {
      const empLoans = loans.filter(l => 
        (selectedEmp.id && Number(l.employee_id) === Number(selectedEmp.id)) ||
        (selectedEmp.name && l.employee_name && l.employee_name.toLowerCase() === selectedEmp.name.toLowerCase())
      );
      const activeLoansTotal = empLoans
        .filter(l => l.status !== 'Rejected' && l.status !== 'Closed')
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

      setForm(prev => ({
        ...prev,
        employee: employeeValue,
        basic: selectedEmp.basic_salary || 0,
        allowances: selectedEmp.allowances || 0,
        deductions: selectedEmp.deductions || 0,
        loan_amount: activeLoansTotal
      }));
    } else {
      setForm(prev => ({ ...prev, employee: employeeValue, loan_amount: 0 }));
    }
  };

  useEffect(() => {
    const fetchAndCalculate = async () => {
      if (!form.employee) return;
      
      const selectedEmp = employees.find(
        emp => String(emp.employee_id) === String(form.employee) || String(emp.id) === String(form.employee)
      );
      if (!selectedEmp) return;
      
      try {
        const employeeValue = form.employee;
        const [attData, leavesData] = await Promise.all([
          hrService.fetchEmployeeAttendance(employeeValue).catch(() => []),
          hrService.fetchEmployeeLeaves(employeeValue).catch(() => [])
        ]);
        
        const targetMonthName = form.month || monthsList[new Date().getMonth()];
        const targetMonthIdx = monthsList.indexOf(targetMonthName); // 0-11
        
        const filterByMonth = (list) => {
          return list.filter(att => {
            if (!att.date) return false;
            const parts = att.date.split('-');
            if (parts.length < 2) return false;
            const monthVal = parseInt(parts[1], 10) - 1; // 0-indexed
            return monthVal === targetMonthIdx;
          });
        };
        
        let filtered = filterByMonth(attData);
        let attLop = filtered.reduce((sum, att) => sum + (Number(att.lop_days) || 0), 0);
        let attOt = filtered.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);
        
        if (attData.length === 0) {
          const fallbackId = selectedEmp.id;
          const attDataById = await hrService.fetchEmployeeAttendance(fallbackId).catch(() => []);
          const filteredById = filterByMonth(attDataById);
          if (attDataById.length > 0) {
            attLop = filteredById.reduce((sum, att) => sum + (Number(att.lop_days) || 0), 0);
            attOt = filteredById.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);
          } else if (selectedEmp.employee_id) {
            const attDataByCode = await hrService.fetchEmployeeAttendance(selectedEmp.employee_id).catch(() => []);
            const filteredByCode = filterByMonth(attDataByCode);
            attLop = filteredByCode.reduce((sum, att) => sum + (Number(att.lop_days) || 0), 0);
            attOt = filteredByCode.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);
          }
        }
        
        setForm(prev => ({
          ...prev,
          lop_days: attLop,
          ot_hours: attOt
        }));
      } catch (err) {
        console.error("Error recalculating payroll fields:", err);
      }
    };
    
    fetchAndCalculate();
  }, [form.employee, form.month, employees, loans]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (r) => {
    setForm({
      employee: r.employee,
      period: r.period || 'Monthly',
      month: r.month || '',
      basic: r.basic || 0,
      allowances: r.allowances || 0,
      deductions: r.deductions || 0,
      lop_days: r.lop_days || 0,
      ot_hours: r.ot_hours || 0,
      loan_amount: r.loan_amount || 0
    });
    setEditingId(r.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.employee || !form.basic) {
      setError('Employee and Basic Salary are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        basic: Number(form.basic),
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
        lop_days: Number(form.lop_days) || 0,
        ot_hours: Number(form.ot_hours) || 0,
        loan_amount: Number(form.loan_amount) || 0
      };

      if (editingId) {
        await updatePayroll(editingId, payload);
        setSuccess('Payroll entry updated successfully!');
      } else {
        await createPayroll(payload);
        setSuccess('Payroll entry added successfully!');
      }
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
            <p><strong>Period:</strong> ${viewingPayslip.period}${viewingPayslip.month ? ' (' + viewingPayslip.month + ')' : ''}</p>
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
    const salary = computeSalary(viewingPayslip);
    const employeeName = employees.find(e => e.employee_id === viewingPayslip.employee || e.id === parseInt(viewingPayslip.employee))?.name || viewingPayslip.employee;

    const doc = new jsPDF();

    // Color theme
    const primaryColor = '#1e293b'; // Slate 800
    const secondaryColor = '#0f766e'; // Teal 700
    const lightBg = '#f8fafc'; // Slate 50

    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text("PAYSLIP", 14, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#64748b");
    doc.text("Dinesh Exports", 14, 30);
    doc.text("The House of Fabrics", 14, 34);

    // Header Right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text("PAYSLIP DETAILS", 140, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 140, 25);
    doc.text(`Status: ${viewingPayslip.status}`, 140, 30);

    // Divider
    doc.setDrawColor('#cbd5e1');
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);

    // Employee Details Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor);
    doc.text("EMPLOYEE INFORMATION", 14, 46);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor('#334155');
    doc.text(`Employee Name:`, 14, 53);
    doc.setFont("helvetica", "bold");
    doc.text(`${employeeName}`, 50, 53);

    doc.setFont("helvetica", "normal");
    doc.text(`Employee ID:`, 14, 59);
    doc.setFont("helvetica", "bold");
    doc.text(`${viewingPayslip.employee}`, 50, 59);

    doc.setFont("helvetica", "normal");
    doc.text(`Pay Period:`, 14, 65);
    doc.setFont("helvetica", "bold");
    doc.text(`${viewingPayslip.period}${viewingPayslip.month ? ' (' + viewingPayslip.month + ')' : ''}`, 50, 65);

    // Earnings & Deductions Table
    const tableColumn = ["Earnings Description", "Amount (INR)", "Deductions Description", "Amount (INR)"];
    
    const basicVal = viewingPayslip.basic || 0;
    const allowancesVal = viewingPayslip.allowances || 0;
    const otHoursVal = viewingPayslip.ot_hours || 0;
    const otAmt = otHoursVal * 200;
    
    const deductionsVal = viewingPayslip.deductions || 0;
    const lopDaysVal = viewingPayslip.lop_days || 0;
    const lopAmt = Math.round((basicVal / 26) * lopDaysVal);

    const tableRows = [
      [
        "Basic Salary", 
        basicVal.toLocaleString(), 
        "Deductions", 
        deductionsVal.toLocaleString()
      ],
      [
        "Allowances", 
        allowancesVal.toLocaleString(), 
        `Loss of Pay (${lopDaysVal} days)`, 
        lopAmt.toLocaleString()
      ],
      [
        `Overtime (${otHoursVal}h x 200)`, 
        otAmt.toLocaleString(), 
        viewingPayslip.loan_amount > 0 ? "Loan Deduction" : "-", 
        viewingPayslip.loan_amount > 0 ? (viewingPayslip.loan_amount || 0).toLocaleString() : "-"
      ],
      [
        "Gross Salary", 
        salary.gross.toLocaleString(), 
        "Total Deductions", 
        salary.deductions.toLocaleString()
      ]
    ];

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: '#ffffff',
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 6
      },
      columnStyles: {
        1: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Net Pay Block
    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFillColor(lightBg);
    doc.rect(14, finalY, 182, 18, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(secondaryColor);
    doc.text("NET TAKE-HOME PAY:", 18, finalY + 11);
    doc.setFontSize(14);
    doc.text(`INR ${salary.net.toLocaleString()}`, 145, finalY + 11);

    // Footer note
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor("#94a3b8");
    doc.text("This is a computer-generated document and does not require a signature.", 14, finalY + 28);
    doc.text("© 2026 Dinesh Exports. All rights reserved.", 14, finalY + 34);

    doc.save(`Payslip_${employeeName.replace(/\s+/g, '_')}_${viewingPayslip.month || 'payroll'}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!viewingPayslip) return;
    const salary = computeSalary(viewingPayslip);
    const employeeName = employees.find(e => e.employee_id === viewingPayslip.employee || e.id === parseInt(viewingPayslip.employee))?.name || viewingPayslip.employee;

    // Create CSV content
    const excelRows = [
      ['PAYSLIP'],
      ['Universe Enterprise v2.0'],
      [''],
      ['Employee Details'],
      ['Name', employeeName],
      ['Employee ID', viewingPayslip.employee],
      ['Period', viewingPayslip.period + (viewingPayslip.month ? ' (' + viewingPayslip.month + ')' : '')],
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
      [`Loss of Pay (${viewingPayslip.lop_days || 0} days)`, `-${Math.round(((viewingPayslip.basic || 0) / 26) * (viewingPayslip.lop_days || 0))}`]
    ];

    if (viewingPayslip.loan_amount > 0) {
      excelRows.push(['Loan Deduction', `-${viewingPayslip.loan_amount}`]);
    }

    excelRows.push(['NET PAY', salary.net]);

    const csvContent = excelRows.map(row => row.join(',')).join('\n');

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
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Calculate employee salaries, and manage allowances and deductions.</p>
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
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{viewingPayslip.period}{viewingPayslip.month ? ` (${viewingPayslip.month})` : ''}</p>
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
                  {viewingPayslip.loan_amount > 0 && (
                    <div className="flex justify-between"><span className="text-slate-500">Loan Deduction</span><span className="font-semibold text-red-600">-₹{(viewingPayslip.loan_amount || 0).toLocaleString()}</span></div>
                  )}
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
                  <button onClick={() => handleDelete(viewingPayslip.id)} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dc2626', borderColor: '#dc2626' }}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by Employee Name or ID..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', height: 44 }} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              value={filterPeriod} 
              onChange={(e) => { setFilterPeriod(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 140 }}
            >
              <option value="">All Periods</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 140 }}
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending Finance">Pending Finance</option>
              <option value="Pending HR">Pending HR</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPeriod('');
                setFilterStatus('');
                setCurrentPage(1);
              }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 14, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
            >
              <RefreshCw size={16} /> Reset
            </button>
            <button 
              onClick={handleAIDetectErrors} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', height: 44, padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#8b5cf6', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <Sparkles size={16} /> AI Detect
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Employee</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Period</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Earnings & Deductions</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Net Pay</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500">
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map(r => {
                const salary = computeSalary(r);
                const empName = employees.find(e => e.employee_id === r.employee || e.id === parseInt(r.employee))?.name || r.employee;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{empName}</p>
                          <p className="text-xs text-slate-500">ID: {r.employee}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">
                      {r.period}{r.month ? ` (${r.month})` : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 text-xs">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Basic: ₹{(r.basic || 0).toLocaleString()}</span>
                        {r.allowances > 0 && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">+ ₹{r.allowances.toLocaleString()}</span>}
                        {r.ot_hours > 0 && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">OT: +{(r.ot_hours * 200).toLocaleString()}</span>}
                        {r.deductions > 0 && <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100">- ₹{r.deductions.toLocaleString()}</span>}
                        {r.lop_days > 0 && <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">LOP: {r.lop_days}d</span>}
                        {r.loan_amount > 0 && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">Loan: -₹{r.loan_amount.toLocaleString()}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      ₹{salary.net.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{
                        backgroundColor: r.status === 'Approved' ? '#10b98118' : r.status === 'Pending Finance' ? '#3b82f618' : '#f59e0b18',
                        color: r.status === 'Approved' ? '#047857' : r.status === 'Pending Finance' ? '#1d4ed8' : '#b45309'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'Pending HR' && (
                          <button onClick={() => approve(r.id, 'Pending Finance')} className="btn btn-primary text-xs px-2 py-1 h-auto" style={{ height: 32 }}>HR Approve</button>
                        )}
                        {r.status === 'Pending Finance' && (
                          <button onClick={() => approve(r.id, 'Approved')} className="btn btn-success text-xs px-2 py-1 h-auto" style={{ height: 32 }}>Fin Approve</button>
                        )}
                        <button onClick={() => setViewingPayslip(r)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                          <Eye size={14} color="#6366f1" />
                        </button>
                        <button onClick={() => handleEdit(r)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                          <Edit2 size={14} color="#3b82f6" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500" style={{ margin: 0 }}>No payroll entries yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Showing <span style={{ fontWeight: 600, color: '#1e293b' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(currentPage * itemsPerPage, filteredRows.length)}</span> of <span style={{ fontWeight: 600, color: '#1e293b' }}>{filteredRows.length}</span> results
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>{/* END DATA AREA */}
      </>
      )}

      {/* Add Entry Form Inline */}
      {showForm && (
        <form className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit Payroll Entry' : 'Add Payroll Entry'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X className="w-4 h-4" /> Close
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                {loading ? 'Saving...' : (editingId ? 'Update Entry' : 'Add Entry')}
              </button>
            </div>
          </div>

          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
            <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Payroll Details
            </legend>

            <div className="form-row">
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Period</label>
                <select className="form-control"
                  value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  <option>Monthly</option><option>Weekly</option><option>Bi-Weekly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Month</label>
                <select className="form-control"
                  value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  <option value="">Select Month</option>
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Basic Salary *</label>
                <input type="number" min="0" className="form-control"
                  value={form.basic} onChange={(e) => setForm({ ...form, basic: e.target.value })} required />
              </div>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
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

            <div className="form-row">
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
              <div className="form-group">
                <label>Loan Amount</label>
                <input type="number" min="0" className="form-control"
                  value={form.loan_amount} onChange={(e) => setForm({ ...form, loan_amount: e.target.value })} />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm border border-slate-100 mt-4">
              <div className="flex justify-between"><span className="text-slate-500">Gross</span><span className="font-semibold text-slate-800">₹{computeSalary(form).gross.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Deductions</span><span className="font-semibold text-red-600">-₹{(Number(form.deductions) || 0).toLocaleString()}</span></div>
              {Number(form.lop_days) > 0 && (
                <div className="flex justify-between"><span className="text-slate-500">Loss of Pay ({form.lop_days} days)</span><span className="font-semibold text-red-600">-₹{Math.round(((Number(form.basic) || 0) / 26) * Number(form.lop_days)).toLocaleString()}</span></div>
              )}
              {Number(form.loan_amount) > 0 && (
                <div className="flex justify-between"><span className="text-amber-700 font-semibold">Loan Deduction</span><span className="font-semibold text-amber-700">-₹{Number(form.loan_amount).toLocaleString()}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: 8 }}><span className="font-bold text-slate-700">Net Pay</span><span className="font-bold text-emerald-600 text-base">₹{computeSalary(form).net.toLocaleString()}</span></div>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
};

export default Payroll;