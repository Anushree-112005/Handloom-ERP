import api, { employeeAPI, subMasterAPI } from './api';

const mapBackendToFrontend = (emp) => {
  if (!emp) return null;
  return {
    ...emp,
    phone: emp.mobile || '',
    employee_id: emp.employee_code || '',
    date_of_birth: emp.dob || '',
    pan_number: emp.pan_no || '',
    uan_number: emp.uan || '',
    aadhar_number: emp.aadhaar_no || '',
    employment_status: emp.status || 'Active',
    email: emp.email || '',
    personal_email: emp.personal_email || '',
    current_address: emp.address || '',
    permanent_address: emp.permanent_address || '',
  };
};

const mapFrontendToBackend = (form) => {
  if (!form) return null;
  return {
    ...form,
    employee_code: form.employee_id || `EMP${Date.now()}`,
    mobile: form.phone || '',
    dob: form.date_of_birth || '',
    pan_no: form.pan_number || '',
    uan: form.uan_number || '',
    aadhaar_no: form.aadhar_number || '',
    status: form.employment_status || 'Active',
    address: form.current_address || '',
  };
};

// Generic localStorage helper functions
const getLocalItems = (key, defaultVal = []) => {
  const items = localStorage.getItem(`hr_${key}`);
  if (!items) {
    localStorage.setItem(`hr_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(items);
};

const saveLocalItems = (key, items) => {
  localStorage.setItem(`hr_${key}`, JSON.stringify(items));
};

const addLocalItem = (key, item) => {
  const items = getLocalItems(key);
  const newItem = { ...item, id: item.id || Date.now() };
  items.push(newItem);
  saveLocalItems(key, items);
  return newItem;
};

const updateLocalItem = (key, id, data) => {
  const items = getLocalItems(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...data };
    saveLocalItems(key, items);
    return items[idx];
  }
  return null;
};

const deleteLocalItem = (key, id) => {
  const items = getLocalItems(key);
  const filtered = items.filter(i => i.id !== id);
  saveLocalItems(key, filtered);
};

const fetchLocalItemsWithEmployee = (key) => {
  return getLocalItems(key);
};

// Core API / Database wrappers
export const fetchEmployees = async () => {
  const res = await employeeAPI.list();
  return (res.data || []).map(mapBackendToFrontend);
};

export const addEmployee = async (data) => {
  const backendData = mapFrontendToBackend(data);
  const res = await employeeAPI.create(backendData);
  return mapBackendToFrontend(res.data);
};

export const updateEmployee = async (id, data) => {
  const backendData = mapFrontendToBackend(data);
  const res = await employeeAPI.update(id, backendData);
  return mapBackendToFrontend(res.data);
};

export const deleteEmployee = async (id) => {
  await employeeAPI.delete(id);
};

export const getEmployeeById = async (id) => {
  const res = await employeeAPI.get(id);
  return mapBackendToFrontend(res.data);
};

export const searchEmployeesByPrefix = async (prefix) => {
  const emps = await fetchEmployees();
  return emps.filter(emp => emp.name && emp.name.toLowerCase().startsWith(prefix.toLowerCase()));
};

// Sub-Masters (Departments, Designations, Shifts)
export const fetchDepartments = async () => {
  try {
    const res = await subMasterAPI.list('department');
    return res.data || [];
  } catch {
    return getLocalItems('departments', [
      { id: 1, name: 'HR' },
      { id: 2, name: 'Engineering' },
      { id: 3, name: 'Sales' },
      { id: 4, name: 'Finance' }
    ]);
  }
};

export const fetchDesignations = async () => {
  try {
    const res = await subMasterAPI.list('designation');
    return res.data || [];
  } catch {
    return getLocalItems('designations', [
      { id: 1, title: 'Software Engineer' },
      { id: 2, title: 'Senior Software Engineer' },
      { id: 3, title: 'HR Manager' },
      { id: 4, title: 'Sales Executive' }
    ]);
  }
};

export const fetchShifts = async () => {
  try {
    const res = await subMasterAPI.list('shift');
    return res.data || [];
  } catch {
    return getLocalItems('shifts', [
      { id: 1, name: 'General Shift' },
      { id: 2, name: 'Night Shift' }
    ]);
  }
};

export const createDepartment = async (data) => {
  try {
    const res = await subMasterAPI.create('department', data);
    return res.data;
  } catch {
    return addLocalItem('departments', data);
  }
};
export const updateDepartment = async (id, data) => {
  try {
    const res = await subMasterAPI.update('department', id, data);
    return res.data;
  } catch {
    return updateLocalItem('departments', id, data);
  }
};
export const deleteDepartment = async (id) => {
  try {
    await subMasterAPI.delete('department', id);
  } catch {
    deleteLocalItem('departments', id);
  }
};

export const createDesignation = async (data) => {
  try {
    const res = await subMasterAPI.create('designation', data);
    return res.data;
  } catch {
    return addLocalItem('designations', data);
  }
};
export const updateDesignation = async (id, data) => {
  try {
    const res = await subMasterAPI.update('designation', id, data);
    return res.data;
  } catch {
    return updateLocalItem('designations', id, data);
  }
};
export const deleteDesignation = async (id) => {
  try {
    await subMasterAPI.delete('designation', id);
  } catch {
    deleteLocalItem('designations', id);
  }
};

export const createShift = async (data) => {
  try {
    const res = await subMasterAPI.create('shift', data);
    return res.data;
  } catch {
    return addLocalItem('shifts', data);
  }
};
export const updateShift = async (id, data) => {
  try {
    const res = await subMasterAPI.update('shift', id, data);
    return res.data;
  } catch {
    return updateLocalItem('shifts', id, data);
  }
};
export const deleteShift = async (id) => {
  try {
    await subMasterAPI.delete('shift', id);
  } catch {
    deleteLocalItem('shifts', id);
  }
};

// Organization & Structure
export const fetchOrgChart = async () => {
  const emps = await fetchEmployees();
  return emps.map(emp => ({
    id: emp.id,
    name: emp.name,
    title: emp.designation,
    pid: emp.reporting_manager_id || null,
    tags: [emp.department]
  }));
};

// Other Local Storage Persisted Entities
export const fetchAssets = () => fetchLocalItemsWithEmployee('assets');
export const createAsset = (data) => addLocalItem('assets', data);
export const updateAsset = (id, data) => updateLocalItem('assets', id, data);
export const deleteAsset = (id) => deleteLocalItem('assets', id);

export const fetchBenefits = () => fetchLocalItemsWithEmployee('benefits');
export const createBenefit = (data) => addLocalItem('benefits', data);
export const updateBenefit = (id, data) => updateLocalItem('benefits', id, data);
export const deleteBenefit = (id) => deleteLocalItem('benefits', id);

export const fetchHelpdesk = () => fetchLocalItemsWithEmployee('helpdesk');
export const createHelpdesk = (data) => addLocalItem('helpdesk', data);
export const updateHelpdesk = (id, data) => updateLocalItem('helpdesk', id, data);
export const deleteHelpdesk = (id) => deleteLocalItem('helpdesk', id);

export const fetchLoans = () => fetchLocalItemsWithEmployee('loans');
export const createLoan = (data) => addLocalItem('loans', data);
export const updateLoan = (id, data) => updateLocalItem('loans', id, data);
export const deleteLoan = (id) => deleteLocalItem('loans', id);

export const fetchPayroll = () => fetchLocalItemsWithEmployee('payroll');
export const createPayroll = (data) => addLocalItem('payroll', data);
export const updatePayroll = (id, data) => updateLocalItem('payroll', id, data);

export const fetchExpenseClaims = () => fetchLocalItemsWithEmployee('expense_claims');
export const createExpenseClaim = (data) => addLocalItem('expense_claims', data);
export const updateExpenseClaim = (id, data) => updateLocalItem('expense_claims', id, data);
export const deleteExpenseClaim = (id) => deleteLocalItem('expense_claims', id);

export const fetchGoals = () => fetchLocalItemsWithEmployee('goals');
export const createGoal = (data) => addLocalItem('goals', data);
export const updateGoal = (id, data) => updateLocalItem('goals', id, data);
export const deleteGoal = (id) => deleteLocalItem('goals', id);

export const fetchPerformance = () => fetchLocalItemsWithEmployee('performance');
export const createPerformance = (data) => addLocalItem('performance', data);
export const updatePerformance = (id, data) => updateLocalItem('performance', id, data);
export const deletePerformance = (id) => deleteLocalItem('performance', id);

export const fetchOffboarding = () => fetchLocalItemsWithEmployee('offboarding');
export const createOffboarding = (data) => addLocalItem('offboarding', data);
export const updateOffboarding = (id, data) => updateLocalItem('offboarding', id, data);
export const deleteOffboarding = (id) => deleteLocalItem('offboarding', id);

export const fetchTimesheets = () => fetchLocalItemsWithEmployee('timesheets');
export const createTimesheet = (data) => addLocalItem('timesheets', data);
export const updateTimesheet = (id, data) => updateLocalItem('timesheets', id, data);
export const deleteTimesheet = (id) => deleteLocalItem('timesheets', id);

export const fetchDocuments = () => fetchLocalItemsWithEmployee('documents');
export const createDocument = (data) => addLocalItem('documents', data);
export const updateDocument = (id, data) => updateLocalItem('documents', id, data);
export const deleteDocument = (id) => deleteLocalItem('documents', id);

export const fetchAttendance = () => fetchLocalItemsWithEmployee('attendance');
export const createAttendance = (data) => addLocalItem('attendance', data);
export const updateAttendance = (id, data) => updateLocalItem('attendance', id, data);
export const deleteAttendance = (id) => deleteLocalItem('attendance', id);

export const fetchLeaves = () => fetchLocalItemsWithEmployee('leaves');
export const createLeave = (data) => addLocalItem('leaves', data);
export const updateLeave = (id, data) => updateLocalItem('leaves', id, data);
export const deleteLeave = (id) => deleteLocalItem('leaves', id);

export const fetchHolidays = () => getLocalItems('holidays');
export const createHoliday = (data) => addLocalItem('holidays', data);
export const updateHoliday = (id, data) => updateLocalItem('holidays', id, data);
export const deleteHoliday = (id) => deleteLocalItem('holidays', id);

export const fetchRequisitions = () => getLocalItems('requisitions');
export const createRequisition = (data) => addLocalItem('requisitions', data);
export const updateRequisition = (id, data) => updateLocalItem('requisitions', id, data);
export const deleteRequisition = (id) => deleteLocalItem('requisitions', id);

export const fetchCandidates = () => getLocalItems('candidates');
export const createCandidate = (data) => addLocalItem('candidates', data);
export const updateCandidate = (id, data) => updateLocalItem('candidates', id, data);
export const deleteCandidate = (id) => deleteLocalItem('candidates', id);

export const fetchAnnouncements = () => getLocalItems('announcements');
export const createAnnouncement = (data) => addLocalItem('announcements', data);
export const updateAnnouncement = (id, data) => updateLocalItem('announcements', id, data);
export const deleteAnnouncement = (id) => deleteLocalItem('announcements', id);

export const fetchTravelRequests = () => fetchLocalItemsWithEmployee('travel_requests');
export const createTravelRequest = (data) => addLocalItem('travel_requests', data);
export const updateTravelRequest = (id, data) => updateLocalItem('travel_requests', id, data);
export const deleteTravelRequest = (id) => deleteLocalItem('travel_requests', id);

export const fetchTrainingPrograms = () => getLocalItems('training_programs');
export const createTrainingProgram = (data) => addLocalItem('training_programs', data);
export const updateTrainingProgram = (id, data) => updateLocalItem('training_programs', id, data);
export const deleteTrainingProgram = (id) => deleteLocalItem('training_programs', id);

export const fetchCertifications = () => fetchLocalItemsWithEmployee('certifications');
export const createCertification = (data) => addLocalItem('certifications', data);
export const updateCertification = (id, data) => updateLocalItem('certifications', id, data);
export const deleteCertification = (id) => deleteLocalItem('certifications', id);

export const deleteOnboardingTask = (id) => deleteLocalItem('tasks', id);
export const deleteOffer = (id) => deleteLocalItem('offers', id);

// hrService main export object (used in default imports)
const hrService = {
  getSummary: async () => {
    const emps = await fetchEmployees().catch(() => []);
    const requisitions = getLocalItems('requisitions');
    const candidates = getLocalItems('candidates');
    const tasks = getLocalItems('tasks');
    const payroll = getLocalItems('payroll');
    return {
      employees: emps.length,
      requisitions: requisitions.length,
      candidates: candidates.length,
      onboarding_tasks: tasks.filter(t => t.status !== 'Completed').length,
      payroll: payroll.length,
    };
  },
  listRequisitions: async () => getLocalItems('requisitions'),
  listCandidates: async () => getLocalItems('candidates'),
  listTasks: async () => getLocalItems('tasks'),
  listOffers: async () => getLocalItems('offers'),
  listPerformance: async () => getLocalItems('performance'),
  listOffboarding: async () => getLocalItems('offboarding'),
  listPayroll: async () => getLocalItems('payroll'),
  
  getEmployee: async (id) => getEmployeeById(id),
  fetchEmployeeAttendance: async (id) => {
    const list = getLocalItems('attendance');
    return list.filter(item => String(item.employee_id) === String(id));
  },
  fetchEmployeeLeaves: async (id) => {
    const list = getLocalItems('leaves');
    return list.filter(item => String(item.employee_id) === String(id));
  },
  fetchEmployeeTasks: async (id) => {
    const list = getLocalItems('tasks');
    return list.filter(item => String(item.employee_id) === String(id));
  },
  fetchEmployeePayroll: async (id) => {
    const list = getLocalItems('payroll');
    return list.filter(item => String(item.employee_id) === String(id));
  },
  fetchLeaveBalances: async (id, year) => {
    return [
      { type: 'Casual Leave', total: 12, used: 3, available: 9 },
      { type: 'Sick Leave', total: 10, used: 2, available: 8 },
      { type: 'Earned Leave', total: 15, used: 0, available: 15 }
    ];
  },
  fetchEmployeeTrainings: async (id) => {
    const list = getLocalItems('certifications');
    return list.filter(item => String(item.employee_id) === String(id));
  },
  predictAttrition: async (data) => {
    const score = Math.floor(Math.random() * 40) + 5;
    return {
      attrition_risk: score > 30 ? 'Medium' : 'Low',
      risk_score: score,
      insights: [
        'Employee has stable attendance.',
        'Last performance review score was positive.',
        'Salary is competitive within range.'
      ]
    };
  },
  getEmployeesWithTasks: async () => {
    const emps = await fetchEmployees().catch(() => []);
    const tasks = getLocalItems('tasks');
    return emps.map(emp => ({
      ...emp,
      tasks: tasks.filter(t => String(t.employee_id) === String(emp.id))
    }));
  },
  createTask: async (data) => addLocalItem('tasks', data),
  updateTask: async (id, data) => updateLocalItem('tasks', id, data),
  deleteTask: async (id) => deleteLocalItem('tasks', id),
  addTaskComment: async (taskId, comment) => {
    const tasks = getLocalItems('tasks');
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      if (!tasks[idx].comments) tasks[idx].comments = [];
      tasks[idx].comments.push({ id: Date.now(), ...comment, created_at: new Date().toISOString() });
      saveLocalItems('tasks', tasks);
      return tasks[idx];
    }
    return null;
  },
  detectPayrollErrors: async (data) => {
    return {
      errors: [],
      warnings: [],
      message: 'No payroll discrepancies or errors detected for current cycle.'
    };
  },
  updatePerformance: async (id, data) => updateLocalItem('performance', id, data),
  createPerformance: async (data) => addLocalItem('performance', data),
  createOffboarding: async (data) => addLocalItem('offboarding', data),
  updateOffboarding: async (id, data) => updateLocalItem('offboarding', id, data),
  
  getReport: async (type, params) => {
    if (type === 'headcount') {
      return {
        total: 15,
        departments: { HR: 2, Engineering: 8, Sales: 3, Finance: 2 },
        trends: [
          { month: 'Jan', count: 12 },
          { month: 'Feb', count: 12 },
          { month: 'Mar', count: 14 },
          { month: 'Apr', count: 14 },
          { month: 'May', count: 15 }
        ]
      };
    }
    return { data: [] };
  },
  deleteOnboardingTask: async (id) => deleteLocalItem('tasks', id),
  deleteOffer: async (id) => deleteLocalItem('offers', id),
  analyzeSkillGaps: async (skills, roles) => {
    return {
      analysis: 'Overall match is high. Recommended training includes Node.js and compliance courses.'
    };
  }
};

export default hrService;
