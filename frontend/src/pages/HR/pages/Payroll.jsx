import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, FileText, Plus, Trash2, X, DollarSign, Eye, User, Calendar, Building, RefreshCw, Download, Printer, FileSpreadsheet, Filter, LayoutList, LayoutGrid, Sparkles, Search, Edit2 } from 'lucide-react';
import hrService, { fetchPayroll, createPayroll, updatePayroll, deletePayroll, fetchLoans, fetchEmployees } from '../../../services/hrService';
import { companySettingAPI } from '../../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const initialForm = {
  employee: '', period: 'Monthly', month: monthsList[new Date().getMonth()],
  basic: 0, allowances: 0, deductions: 0, lop_days: 0, ot_hours: 0, loan_amount: 0, advance: 0
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
  const [viewingAttendance, setViewingAttendance] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
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
  const [companySettings, setCompanySettings] = useState(null);

  useEffect(() => {
    const fetchViewingAttendance = async () => {
      if (!viewingPayslip) {
        setViewingAttendance([]);
        return;
      }
      try {
        const empCode = viewingPayslip.employee;
        const targetMonthName = viewingPayslip.month || monthsList[new Date().getMonth()];
        const targetMonthIdx = monthsList.indexOf(targetMonthName);

        const filterByMonth = (list) => {
          return list.filter(att => {
            if (!att.date) return false;
            const parts = att.date.split('-');
            if (parts.length < 2) return false;
            const monthVal = parseInt(parts[1], 10) - 1; // 0-indexed
            return monthVal === targetMonthIdx;
          });
        };

        let attData = await hrService.fetchEmployeeAttendance(empCode).catch(() => []);
        let filtered = filterByMonth(attData);

        if (filtered.length === 0) {
          // Try fetching by database numeric ID if empCode didn't return anything
          const selectedEmp = employees.find(
            emp => String(emp.employee_id) === String(empCode) || String(emp.id) === String(empCode)
          );
          if (selectedEmp) {
            const attDataById = await hrService.fetchEmployeeAttendance(selectedEmp.id).catch(() => []);
            filtered = filterByMonth(attDataById);
          }
        }

        filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setViewingAttendance(filtered);
      } catch (err) {
        console.error("Error fetching viewing attendance:", err);
      }
    };
    fetchViewingAttendance();
  }, [viewingPayslip, employees]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payrollData, empData, loanData, settingsRes] = await Promise.all([
        fetchPayroll(),
        fetchEmployees(),
        fetchLoans().catch(() => []),
        companySettingAPI.get().catch(() => null)
      ]);
      setRows(payrollData || []);
      setEmployees(empData || []);
      setLoans(loanData || []);
      if (settingsRes && settingsRes.data) {
        setCompanySettings(settingsRes.data);
      }
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
    const totalDeductions = (Number(r.deductions) || 0) + (((Number(r.basic) || 0) / 26) * (Number(r.lop_days) || 0)) + (Number(r.loan_amount) || 0) + (Number(r.advance) || 0);
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
        loan_amount: 0,
        advance: 0
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
        loan_amount: activeLoansTotal,
        advance: 0
      }));
    } else {
      setForm(prev => ({ ...prev, employee: employeeValue, loan_amount: 0, advance: 0 }));
    }
  };

  const getLop = (filteredList, leaveDays) => {
    const pCount = filteredList.length;
    // Absent days: standard 26 working days minus present minus approved leaves
    const absDays = Math.max(0, 26 - pCount - leaveDays);
    // 1 absent day per month is paid (with salary); second absent day and onwards are LOP
    const absLop = Math.max(0, absDays - 1);
    
    // Half day checkouts: check if check_out is before 17:00 (5:00 PM)
    let hdLop = 0;
    filteredList.forEach(att => {
      const co = att.check_out || att.checkout;
      if (co) {
        const parts = co.split(':');
        if (parts.length >= 2) {
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          // 17:00 is 17 * 60 = 1020 minutes
          if (hours * 60 + minutes < 1020) {
            hdLop += 0.5;
          }
        }
      }
    });
    return absLop + hdLop;
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
        let presentCount = filtered.length;
        
        const filterLeavesByMonth = (list) => {
          return list.filter(leave => {
            if (leave.status !== 'Approved') return false;
            const sDate = leave.start_date || leave.from_date || '';
            if (!sDate) return false;
            const parts = sDate.split('-');
            if (parts.length < 2) return false;
            const monthVal = parseInt(parts[1], 10) - 1; // 0-indexed
            return monthVal === targetMonthIdx;
          });
        };
        const approvedLeaves = filterLeavesByMonth(leavesData);
        const approvedLeaveDays = approvedLeaves.reduce((sum, leave) => {
          const days = Number(leave.days || leave.total_days || leave.number_of_days || 1);
          return sum + days;
        }, 0);
        
        let attLop = getLop(filtered, approvedLeaveDays);
        let attOt = filtered.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);
        
        if (attData.length === 0) {
          const fallbackId = selectedEmp.id;
          const [attDataById, leavesDataById] = await Promise.all([
            hrService.fetchEmployeeAttendance(fallbackId).catch(() => []),
            hrService.fetchEmployeeLeaves(fallbackId).catch(() => [])
          ]);
          const filteredById = filterByMonth(attDataById);
          const approvedLeavesById = filterLeavesByMonth(leavesDataById);
          const approvedLeaveDaysById = approvedLeavesById.reduce((sum, leave) => {
            const days = Number(leave.days || leave.total_days || leave.number_of_days || 1);
            return sum + days;
          }, 0);
          
          if (attDataById.length > 0) {
            presentCount = filteredById.length;
            attLop = getLop(filteredById, approvedLeaveDaysById);
            attOt = filteredById.reduce((sum, att) => sum + (Number(att.ot_hours) || 0), 0);
          } else if (selectedEmp.employee_id) {
            const [attDataByCode, leavesDataByCode] = await Promise.all([
              hrService.fetchEmployeeAttendance(selectedEmp.employee_id).catch(() => []),
              hrService.fetchEmployeeLeaves(selectedEmp.employee_id).catch(() => [])
            ]);
            const filteredByCode = filterByMonth(attDataByCode);
            const approvedLeavesByCode = filterLeavesByMonth(leavesDataByCode);
            const approvedLeaveDaysByCode = approvedLeavesByCode.reduce((sum, leave) => {
              const days = Number(leave.days || leave.total_days || leave.number_of_days || 1);
              return sum + days;
            }, 0);
            
            presentCount = filteredByCode.length;
            attLop = getLop(filteredByCode, approvedLeaveDaysByCode);
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
    setEmpSearch('');
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
      loan_amount: r.loan_amount || 0,
      advance: r.advance || 0
    });
    const emp = employees.find(e => String(e.employee_id) === String(r.employee) || String(e.id) === String(r.employee));
    if (emp) {
      setEmpSearch(`${emp.name} (${emp.employee_id || emp.id})`);
    } else {
      setEmpSearch(r.employee);
    }
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
        loan_amount: Number(form.loan_amount) || 0,
        advance: Number(form.advance) || 0
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

  const viewingEmpDetails = useMemo(() => {
    if (!viewingPayslip) return {};
    return employees.find(e => e.employee_id === viewingPayslip.employee || e.id === parseInt(viewingPayslip.employee)) || {};
  }, [viewingPayslip, employees]);

  const viewingValues = useMemo(() => {
    if (!viewingPayslip) return { basicPayDa: 0, otAmt: 0, computedGross: 0, computedDeductions: 0, computedNet: 0, basicVal: 0, allowancesVal: 0, deductionsVal: 0, lopDaysVal: 0, loanAmt: 0, advanceVal: 0 };
    const basicVal = viewingPayslip.basic || 0;
    const allowancesVal = viewingPayslip.allowances || 0;
    const otHoursVal = viewingPayslip.ot_hours || 0;
    const otAmt = otHoursVal * 200;
    const deductionsVal = viewingPayslip.deductions || 0;
    const lopDaysVal = viewingPayslip.lop_days || 0;
    const lopAmt = Math.round((basicVal / 26) * lopDaysVal);
    const loanAmt = viewingPayslip.loan_amount || 0;
    const advanceVal = viewingPayslip.advance || 0;

    const basicPayDa = basicVal - lopAmt;
    const computedGross = basicPayDa + allowancesVal + otAmt;
    const computedDeductions = deductionsVal + loanAmt + advanceVal;
    const computedNet = computedGross - computedDeductions;

    return { basicVal, allowancesVal, otAmt, deductionsVal, lopDaysVal, loanAmt, advanceVal, basicPayDa, computedGross, computedDeductions, computedNet };
  }, [viewingPayslip]);

  const handlePrint = () => {
    if (!viewingPayslip) return;
    const printWindow = window.open('', '_blank');
    const empDetails = viewingEmpDetails;
    const employeeName = empDetails.name || viewingPayslip.employee;
    const { basicVal, allowancesVal, otAmt, deductionsVal, lopDaysVal, loanAmt, advanceVal, basicPayDa, computedGross, computedDeductions, computedNet } = viewingValues;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${employeeName}</title>
        <style>
          body { font-family: monospace, Courier, sans-serif; padding: 20px; color: #000; background: #fff; }
          .payslip-container { max-width: 900px; margin: 0 auto; border: 1.5px solid #000; padding: 20px; }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase; }
          .header p { margin: 4px 0; font-size: 12px; }
          .header h2 { margin: 10px 0 0 0; font-size: 14px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 10px; font-size: 12px; }
          td { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; }
          .font-bold { font-weight: bold; }
          .text-right { text-align: right; }
          .bg-light { background-color: #f8fafc; }
          .bg-total { background-color: #ecfdf5; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 30px; }
          .sig-box { text-align: center; }
          .sig-line { border-top: 1px dashed #000; width: 180px; padding-top: 5px; font-weight: bold; font-size: 11px; }
          @media print {
            body { padding: 0; }
            .payslip-container { border: 1.5px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <div class="header">
            <h1>${companySettings?.company_name || 'Handloom ERP Pvt Ltd'}</h1>
            <p>${companySettings?.address || '1/6-A, Aiyndhupanai, Kadachanallur, Pallipalayam Road, Komarapalayam Tk, Namakkal Dt - 638008'}</p>
            <h2>Pay in Slip for the Period of ${viewingPayslip.month || 'May'} ${viewingPayslip.year || '2026'}</h2>
          </div>
          <table>
            <tbody>
              <tr>
                <td class="font-bold" style="width: 15%;">Employee ID</td>
                <td style="width: 15%;">${empDetails.employee_id || viewingPayslip.employee}</td>
                <td class="font-bold" style="width: 15%;">Name</td>
                <td style="width: 20%;">${employeeName}</td>
                <td class="font-bold bg-light" style="width: 15%;">Earnings</td>
                <td class="font-bold text-right bg-light" style="width: 10%;">Amount</td>
                <td class="font-bold bg-light" style="width: 15%;">Deductions</td>
                <td class="font-bold text-right bg-light" style="width: 10%;">Amount</td>
              </tr>
              <tr>
                <td class="font-bold">Department</td>
                <td>${empDetails.department || '—'}</td>
                <td class="font-bold">Designation</td>
                <td>${empDetails.designation || '—'}</td>
                <td>Basic Pay & DA</td>
                <td class="text-right">${Math.max(0, basicPayDa).toLocaleString()}</td>
                <td>ESI</td>
                <td class="text-right">0</td>
              </tr>
              <tr>
                <td class="font-bold">Date of Joining</td>
                <td>${empDetails.date_of_joining ? new Date(empDetails.date_of_joining).toLocaleDateString('en-IN') : '—'}</td>
                <td class="font-bold">PF Account Number</td>
                <td>${empDetails.pf_account || empDetails.pan_number || '—'}</td>
                <td>HRA</td>
                <td class="text-right">0</td>
                <td>Provident Fund</td>
                <td class="text-right">${deductionsVal.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="font-bold">Days Worked</td>
                <td>${(26 - lopDaysVal).toFixed(2)}</td>
                <td class="font-bold">UAN</td>
                <td>${empDetails.uan_number || '—'}</td>
                <td>Incentive</td>
                <td class="text-right">${otAmt.toLocaleString()}</td>
                <td>Professional Tax</td>
                <td class="text-right">0</td>
              </tr>
              <tr>
                <td class="font-bold">Leave Days</td>
                <td>${lopDaysVal.toFixed(2)}</td>
                <td class="font-bold">Father's/Hus Name</td>
                <td>${empDetails.family_details || empDetails.emergency_contact_name || '—'}</td>
                <td>Other Allowance</td>
                <td class="text-right">${allowancesVal.toLocaleString()}</td>
                <td>TDS</td>
                <td class="text-right">0</td>
              </tr>
              <tr>
                <td class="font-bold">Bank Account No.</td>
                <td>${empDetails.account_number || '—'}</td>
                <td class="font-bold">IFSC Code</td>
                <td>${empDetails.ifsc_code || '—'}</td>
                <td class="font-bold bg-light">Total Earnings</td>
                <td class="font-bold text-right bg-light">${computedGross.toLocaleString()}</td>
                <td>Advance</td>
                <td class="text-right">${loanAmt.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2"></td>
                <td colspan="2"></td>
                <td class="font-bold bg-light">Previous Balance</td>
                <td class="text-right bg-light">0</td>
                <td class="font-bold bg-light">Total Deductions</td>
                <td class="font-bold text-right bg-light">${computedDeductions.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2"></td>
                <td colspan="2"></td>
                <td colspan="2"></td>
                <td class="font-bold bg-total" style="font-size: 13px;">Net Pay</td>
                <td class="font-bold text-right bg-total" style="font-size: 13px; color: #16a34a;">₹${computedNet.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line">Employer's Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Employee's Signature</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    if (!viewingPayslip) return;
    const empDetails = viewingEmpDetails;
    const employeeName = empDetails.name || viewingPayslip.employee;
    const { basicVal, allowancesVal, otAmt, deductionsVal, lopDaysVal, loanAmt, advanceVal, basicPayDa, computedGross, computedDeductions, computedNet } = viewingValues;

    const doc = new jsPDF('l', 'mm', 'a4');

    // Header Title
    doc.setFont("courier", "bold");
    doc.setFontSize(18);
    doc.setTextColor("#000000");
    doc.text(companySettings?.company_name || "HANDLOOM ERP PVT LTD", 148, 20, { align: 'center' });

    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text(companySettings?.address || "1/6-A, Aiyndhupanai, Kadachanallur, Pallipalayam Road, Komarapalayam Tk, Namakkal Dt - 638008", 148, 26, { align: 'center' });
    
    doc.setFont("courier", "bold");
    doc.text(`Pay in Slip for the Period of ${viewingPayslip.month || 'May'} 2026`, 148, 34, { align: 'center' });

    const tableBody = [
      [
        { content: "Employee ID", styles: { fontStyle: 'bold' } },
        empDetails.employee_id || viewingPayslip.employee,
        { content: "Name", styles: { fontStyle: 'bold' } },
        employeeName,
        { content: "Earnings", styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: "Amount", styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } },
        { content: "Deductions", styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: "Amount", styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } },
      ],
      [
        { content: "Department", styles: { fontStyle: 'bold' } },
        empDetails.department || '—',
        { content: "Designation", styles: { fontStyle: 'bold' } },
        empDetails.designation || '—',
        "Basic Pay & DA",
        { content: Math.max(0, basicPayDa).toLocaleString(), styles: { halign: 'right' } },
        "ESI",
        { content: "0", styles: { halign: 'right' } },
      ],
      [
        { content: "Date of Joining", styles: { fontStyle: 'bold' } },
        empDetails.date_of_joining ? new Date(empDetails.date_of_joining).toLocaleDateString('en-IN') : '—',
        { content: "PF Account Number", styles: { fontStyle: 'bold' } },
        empDetails.pf_account || empDetails.pan_number || '—',
        "HRA",
        { content: "0", styles: { halign: 'right' } },
        "Provident Fund",
        { content: deductionsVal.toLocaleString(), styles: { halign: 'right' } },
      ],
      [
        { content: "Days Worked", styles: { fontStyle: 'bold' } },
        (26 - lopDaysVal).toFixed(2),
        { content: "UAN", styles: { fontStyle: 'bold' } },
        empDetails.uan_number || '—',
        "Incentive",
        { content: otAmt.toLocaleString(), styles: { halign: 'right' } },
        "Professional Tax",
        { content: "0", styles: { halign: 'right' } },
      ],
      [
        { content: "Leave Days", styles: { fontStyle: 'bold' } },
        lopDaysVal.toFixed(2),
        { content: "Father's/Hus Name", styles: { fontStyle: 'bold' } },
        empDetails.family_details || empDetails.emergency_contact_name || '—',
        "Other Allowance",
        { content: allowancesVal.toLocaleString(), styles: { halign: 'right' } },
        "TDS",
        { content: "0", styles: { halign: 'right' } },
      ],
      [
        { content: "Bank Account No.", styles: { fontStyle: 'bold' } },
        empDetails.account_number || '—',
        { content: "IFSC Code", styles: { fontStyle: 'bold' } },
        empDetails.ifsc_code || '—',
        { content: "Total Earnings", styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: computedGross.toLocaleString(), styles: { halign: 'right', fontStyle: 'bold', fillColor: [248, 250, 252] } },
        "Advance",
        { content: (loanAmt + advanceVal).toLocaleString(), styles: { halign: 'right' } },
      ],
      [
        "", "", "", "",
        { content: "Previous Balance", styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: "0", styles: { halign: 'right', fillColor: [248, 250, 252] } },
        { content: "Total Deductions", styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: computedDeductions.toLocaleString(), styles: { halign: 'right', fontStyle: 'bold', fillColor: [248, 250, 252] } },
      ],
      [
        "", "", "", "", "", "",
        { content: "Net Pay", styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } },
        { content: `INR ${computedNet.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [22, 163, 74] } },
      ],
    ];

    autoTable(doc, {
      body: tableBody,
      startY: 42,
      theme: 'grid',
      styles: {
        font: 'courier',
        fontSize: 9,
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 25;
    
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.line(20, finalY, 80, finalY);
    doc.text("Employer's Signature", 50, finalY + 5, { align: 'center' });

    doc.line(210, finalY, 270, finalY);
    doc.text("Employee's Signature", 240, finalY + 5, { align: 'center' });

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
    if (viewingPayslip.advance > 0) {
      excelRows.push(['Advance Deduction', `-${viewingPayslip.advance}`]);
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

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Calculator size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Gross</h3>
              <div className="value">₹{totals.gross.toLocaleString()}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Deductions</h3>
              <div className="value">₹{totals.deductions.toLocaleString()}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Net Pay</h3>
              <div className="value">₹{totals.net.toLocaleString()}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <FileText size={24} />
            </div>
            <div className="stat-details">
              <h3>Pending Approvals</h3>
              <div className="value">{totals.pending}</div>
            </div>
          </div>
        </div>

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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center animate-fade">
            <div className="card" style={{ width: '100%', maxWidth: 880, padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Payslip Details</h2>
                <button onClick={() => setViewingPayslip(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6" ref={payslipRef} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
                <div style={{ border: '1.5px solid #000', padding: 24, fontFamily: 'monospace, Courier, sans-serif', color: '#000', backgroundColor: '#fff', fontSize: 13, borderRadius: 8 }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                      {companySettings?.company_name || 'HANDLOOM ERP PVT LTD'}
                    </h2>
                    <p style={{ margin: 0, fontSize: 11, lineHeight: '1.4', opacity: 0.8 }}>
                      {companySettings?.address || '1/6-A, Aiyndhupanai, Kadachanallur, Pallipalayam Road, Komarapalayam Tk, Namakkal Dt - 638008'}
                    </p>
                    <h3 style={{ margin: '12px 0 0 0', fontSize: 14, fontWeight: 'bold', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 0' }}>
                      Pay in Slip for the Period of {viewingPayslip.month || 'May'} {viewingPayslip.year || '2026'}
                    </h3>
                  </div>

                  {/* Main Grid Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', color: '#000', fontSize: '12px' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '15%' }}>Employee ID</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', width: '15%' }}>{viewingEmpDetails.employee_id || viewingPayslip.employee}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '15%' }}>Name</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', width: '20%' }}>{viewingEmpDetails.name || viewingPayslip.employee}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '15%', backgroundColor: '#f1f5f9' }}>Earnings</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '10%', textAlign: 'right', backgroundColor: '#f1f5f9' }}>Amount</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '15%', backgroundColor: '#f1f5f9' }}>Deductions</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '10%', textAlign: 'right', backgroundColor: '#f1f5f9' }}>Amount</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Department</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.department || '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Designation</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.designation || '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Basic Pay & DA</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{Math.max(0, viewingValues.basicPayDa).toLocaleString()}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>ESI</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>0</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Date of Joining</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.date_of_joining ? new Date(viewingEmpDetails.date_of_joining).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>PF Account Number</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.pf_account || viewingEmpDetails.pan_number || '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>HRA</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>0</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Provident Fund</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{viewingValues.deductionsVal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Days Worked</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{(26 - viewingValues.lopDaysVal).toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>UAN</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.uan_number || '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Incentive</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{viewingValues.otAmt.toLocaleString()}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Professional Tax</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>0</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Leave Days</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingValues.lopDaysVal.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Father's/Hus Name</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.family_details || viewingEmpDetails.emergency_contact_name || '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Other Allowance</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{viewingValues.allowancesVal.toLocaleString()}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>TDS</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>0</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Bank Account No.</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.account_number || '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>IFSC Code</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{viewingEmpDetails.ifsc_code || '—'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Total Earnings</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>{viewingValues.computedGross.toLocaleString()}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Advance</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{viewingValues.loanAmt.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan="2"></td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan="2"></td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Previous Balance</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', backgroundColor: '#f8fafc' }}>0</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Total Deductions</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>{viewingValues.computedDeductions.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan="2"></td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan="2"></td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan="2"></td>
                        <td style={{ border: '1px solid #000', padding: '8px 10px', fontWeight: 'bold', backgroundColor: '#ecfdf5', fontSize: '13px' }}>Net Pay</td>
                        <td style={{ border: '1px solid #000', padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#ecfdf5', fontSize: '13px', color: '#16a34a' }}>₹{viewingValues.computedNet.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, padding: '0 20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px dashed #000', width: 200, paddingTop: 8, fontSize: 11, fontWeight: 'bold' }}>Employer's Signature</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px dashed #000', width: 200, paddingTop: 8, fontSize: 11, fontWeight: 'bold' }}>Employee's Signature</div>
                    </div>
                  </div>

                  {/* Daily Attendance Logs */}
                  {viewingAttendance && viewingAttendance.length > 0 && (
                    <div style={{ marginTop: 32, borderTop: '2px solid #000', paddingTop: 20 }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
                        Daily Attendance Logs ({viewingPayslip.month})
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px', color: '#000' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f1f5f9' }}>
                            <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left' }}>Date</th>
                            <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>Check-In</th>
                            <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>Check-Out</th>
                            <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>OT Hours</th>
                            <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left' }}>Status / Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingAttendance.map((att, idx) => {
                            const co = att.check_out || att.checkout;
                            let isHalfDay = false;
                            if (co) {
                              const parts = co.split(':');
                              if (parts.length >= 2) {
                                isHalfDay = (parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)) < 1020;
                              }
                            }
                            return (
                              <tr key={idx} style={{ backgroundColor: isHalfDay ? '#fffbeb' : 'transparent' }}>
                                <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{att.date || '—'}</td>
                                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{att.check_in || att.checkin || '—'}</td>
                                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{att.check_out || att.checkout || '—'}</td>
                                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}>{att.ot_hours || 0}</td>
                                <td style={{ border: '1px solid #000', padding: '6px 8px', color: isHalfDay ? '#d97706' : 'inherit', fontWeight: isHalfDay ? 'bold' : 'normal' }}>
                                  {att.status || 'Present'} {isHalfDay ? '(Half Day Checkout - LOP)' : ''}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: 'none' }}>
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
                        {r.advance > 0 && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">Advance: -₹{r.advance.toLocaleString()}</span>}
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
        <form className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, border: 'none' }} onSubmit={handleSubmit}>
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
              <div className="form-group" style={{ gridColumn: 'span 3', position: 'relative' }}>
                <label>Employee *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Employee Name or ID..."
                    value={empSearch}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                      setEmpSearch(e.target.value);
                      setIsOpen(true);
                      if (!e.target.value) {
                        handleEmployeeChange('');
                      }
                    }}
                    required={!form.employee}
                  />
                  {form.employee && (
                    <button
                      type="button"
                      onClick={() => {
                        handleEmployeeChange('');
                        setEmpSearch('');
                      }}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 4
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {isOpen && (
                  <>
                    <div 
                      onClick={() => setIsOpen(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 40,
                        cursor: 'default'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        maxHeight: 250,
                        overflowY: 'auto',
                        zIndex: 50,
                        marginTop: 4
                      }}
                    >
                      {employees
                        .filter(emp => {
                          const query = empSearch.toLowerCase();
                          return (
                            emp.name?.toLowerCase().includes(query) ||
                            (emp.employee_id || '').toString().toLowerCase().includes(query)
                          );
                        })
                        .map(emp => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              handleEmployeeChange(emp.employee_id || emp.id);
                              setEmpSearch(`${emp.name} (${emp.employee_id || emp.id})`);
                              setIsOpen(false);
                            }}
                            style={{
                              padding: '10px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              color: '#1e293b',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>ID: {emp.employee_id || emp.id}</div>
                          </div>
                        ))}
                      {employees.filter(emp => {
                        const query = empSearch.toLowerCase();
                        return (
                          emp.name?.toLowerCase().includes(query) ||
                          (emp.employee_id || '').toString().toLowerCase().includes(query)
                        );
                      }).length === 0 && (
                        <div style={{ padding: '12px 16px', color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                          No employees found
                        </div>
                      )}
                    </div>
                  </>
                )}
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
              <div className="form-group">
                <label>Advance</label>
                <input type="number" min="0" className="form-control"
                  value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })} />
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
              {Number(form.advance) > 0 && (
                <div className="flex justify-between"><span className="text-amber-700 font-semibold">Advance Deduction</span><span className="font-semibold text-amber-700">-₹{Number(form.advance).toLocaleString()}</span></div>
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
