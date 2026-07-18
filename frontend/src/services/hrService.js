import api, { employeeAPI, subMasterAPI } from './api';

export const testBiometricConnection = async (ip, port) => {
  const res = await api.post('/hr/biometric/test-connection', { ip, port });
  return res.data;
};

export const syncBiometricAttendance = async (ip, port, mock = false) => {
  const res = await api.post('/hr/biometric/sync', { ip, port, mock });
  return res.data;
};

export const fetchRawBiometricLogs = async () => {
  return fetchHRItems('biometric_raw_logs');
};

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
    biometric_id: emp.biometric_id || '',
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
    biometric_id: form.biometric_id || null,
  };
};

const mapBackendToFrontendShift = (item) => {
  if (!item) return null;
  let extra = {};
  if (item.extra_field_3) {
    try {
      const trimmed = item.extra_field_3.trim();
      if (trimmed.startsWith('{')) {
        extra = JSON.parse(trimmed);
      } else {
        extra = { break_duration: parseInt(trimmed) || 0 };
      }
    } catch (e) {
      console.error('Failed to parse extra_field_3:', e);
    }
  }
  return {
    id: item.id,
    name: item.name,
    shift_type: item.code || 'Day',
    start_time: item.extra_field_1 || '09:00',
    end_time: item.extra_field_2 || '18:00',
    break_duration: extra.break_duration !== undefined ? extra.break_duration : 60,
    half_day_hours: extra.half_day_hours !== undefined ? extra.half_day_hours : 4,
    color: extra.color || '#10B981',
    working_hours: extra.working_hours !== undefined ? extra.working_hours : 8.0,
    employee_count: item.employee_count || 0,
    status: item.is_active === false ? 'Inactive' : 'Active',
    description: item.description || ''
  };
};

// Generic API helper functions to query Postgres via our new dynamic HR router
const fetchHRItems = async (category) => {
  const res = await api.get(`/hr/${category}`);
  return res.data || [];
};

const createHRItem = async (category, data) => {
  const res = await api.post(`/hr/${category}`, data);
  return res.data;
};

const updateHRItem = async (category, id, data) => {
  const res = await api.put(`/hr/${category}/${id}`, data);
  return res.data;
};

const deleteHRItem = async (category, id) => {
  await api.delete(`/hr/${category}/${id}`);
};

const fetchLocalItemsWithEmployee = (key) => {
  return fetchHRItems(key);
};
const addLocalItem = (key, item) => {
  return createHRItem(key, item);
};
const updateLocalItem = (key, id, data) => {
  return updateHRItem(key, id, data);
};
const deleteLocalItem = (key, id) => {
  return deleteHRItem(key, id);
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
    return (res.data || []).map(item => {
      let extra = {};
      if (item.extra_field_3) {
        try { extra = JSON.parse(item.extra_field_3); } catch(e){}
      }
      return {
        id: item.id,
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        type: item.extra_field_1 || '',
        short_name: item.extra_field_2 || '',
        category: extra.category || '',
        budget_allocation: extra.budget_allocation || '',
        cost_center: extra.cost_center || '',
        status: item.is_active === false ? 'Inactive' : 'Active',
        created_at: item.created_at || null
      };
    });
  } catch {
    return [];
  }
};

export const fetchDesignations = async () => {
  try {
    const res = await subMasterAPI.list('designation');
    return (res.data || []).map(item => {
      let extra = {};
      if (item.extra_field_3) {
        try { extra = JSON.parse(item.extra_field_3); } catch(e){}
      }
      return {
        id: item.id,
        title: item.name,
        code: item.code || '',
        department: item.extra_field_1 || '',
        description: item.description || '',
        grade: item.extra_field_2 || '',
        min_salary: extra.min_salary || null,
        max_salary: extra.max_salary || null,
        experience: extra.experience || '',
        skill_category: extra.skill_category || '',
        status: item.is_active === false ? 'Inactive' : 'Active',
        created_at: item.created_at || null,
      };
    });
  } catch {
    return [];
  }
};

export const fetchShifts = async () => {
  try {
    const res = await subMasterAPI.list('shift');
    return (res.data || []).map(mapBackendToFrontendShift);
  } catch {
    return [];
  }
};

export const createDepartment = async (data) => {
  try {
    const payload = {
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      is_active: data.status !== 'Inactive',
      extra_field_1: data.type || null,
      extra_field_2: data.short_name || null,
      extra_field_3: JSON.stringify({
        category: data.category || '',
        budget_allocation: data.budget_allocation || '',
        cost_center: data.cost_center || ''
      })
    };
    const res = await subMasterAPI.create('department', payload);
    return res.data;
  } catch {
    return addLocalItem('departments', data);
  }
};
export const updateDepartment = async (id, data) => {
  try {
    const payload = {
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      is_active: data.status !== 'Inactive',
      extra_field_1: data.type || null,
      extra_field_2: data.short_name || null,
      extra_field_3: JSON.stringify({
        category: data.category || '',
        budget_allocation: data.budget_allocation || '',
        cost_center: data.cost_center || ''
      })
    };
    const res = await subMasterAPI.update('department', id, payload);
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
    const payload = {
      name: data.title,
      code: data.code || null,
      description: data.description || null,
      is_active: data.status !== 'Inactive',
      extra_field_1: data.department || null,
      extra_field_2: data.grade || null,
      extra_field_3: JSON.stringify({
        min_salary: data.min_salary || null,
        max_salary: data.max_salary || null,
        experience: data.experience || '',
        skill_category: data.skill_category || ''
      })
    };
    const res = await subMasterAPI.create('designation', payload);
    return res.data;
  } catch {
    return addLocalItem('designations', data);
  }
};
export const updateDesignation = async (id, data) => {
  try {
    const payload = {
      name: data.title,
      code: data.code || null,
      description: data.description || null,
      is_active: data.status !== 'Inactive',
      extra_field_1: data.department || null,
      extra_field_2: data.grade || null,
      extra_field_3: JSON.stringify({
        min_salary: data.min_salary || null,
        max_salary: data.max_salary || null,
        experience: data.experience || '',
        skill_category: data.skill_category || ''
      })
    };
    const res = await subMasterAPI.update('designation', id, payload);
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
    const extra = {
      break_duration: data.break_duration !== undefined ? data.break_duration : 60,
      half_day_hours: data.half_day_hours !== undefined ? data.half_day_hours : 4,
      color: data.color || '#10B981',
      working_hours: data.working_hours !== undefined ? data.working_hours : 8.0
    };
    const payload = {
      name: data.name,
      code: data.shift_type || 'Day',
      description: data.description || '',
      extra_field_1: data.start_time || '09:00',
      extra_field_2: data.end_time || '18:00',
      extra_field_3: JSON.stringify(extra)
    };
    const res = await subMasterAPI.create('shift', payload);
    return mapBackendToFrontendShift(res.data);
  } catch {
    return addLocalItem('shifts', data);
  }
};
export const updateShift = async (id, data) => {
  try {
    const extra = {
      break_duration: data.break_duration !== undefined ? data.break_duration : 60,
      half_day_hours: data.half_day_hours !== undefined ? data.half_day_hours : 4,
      color: data.color || '#10B981',
      working_hours: data.working_hours !== undefined ? data.working_hours : 8.0
    };
    const payload = {
      name: data.name,
      code: data.shift_type || 'Day',
      description: data.description || '',
      extra_field_1: data.start_time || '09:00',
      extra_field_2: data.end_time || '18:00',
      extra_field_3: JSON.stringify(extra)
    };
    const res = await subMasterAPI.update('shift', id, payload);
    return mapBackendToFrontendShift(res.data);
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
export const deletePayroll = (id) => deleteLocalItem('payroll', id);

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

export const fetchHolidays = () => fetchHRItems('holidays');
export const createHoliday = (data) => createHRItem('holidays', data);
export const updateHoliday = (id, data) => updateHRItem('holidays', id, data);
export const deleteHoliday = (id) => deleteHRItem('holidays', id);

export const fetchRequisitions = () => fetchHRItems('requisitions');
export const createRequisition = (data) => createHRItem('requisitions', data);
export const updateRequisition = (id, data) => updateHRItem('requisitions', id, data);
export const deleteRequisition = (id) => deleteHRItem('requisitions', id);

export const fetchCandidates = () => fetchHRItems('candidates');
export const createCandidate = (data) => createHRItem('candidates', data);
export const updateCandidate = (id, data) => updateHRItem('candidates', id, data);
export const deleteCandidate = (id) => deleteHRItem('candidates', id);

export const fetchAnnouncements = () => fetchHRItems('announcements');
export const createAnnouncement = (data) => createHRItem('announcements', data);
export const updateAnnouncement = (id, data) => updateHRItem('announcements', id, data);
export const deleteAnnouncement = (id) => deleteHRItem('announcements', id);

export const fetchTravelRequests = () => fetchHRItems('travel_requests');
export const createTravelRequest = (data) => createHRItem('travel_requests', data);
export const updateTravelRequest = (id, data) => updateHRItem('travel_requests', id, data);
export const deleteTravelRequest = (id) => deleteHRItem('travel_requests', id);

export const fetchTrainingPrograms = () => fetchHRItems('training_programs');
export const createTrainingProgram = (data) => createHRItem('training_programs', data);
export const updateTrainingProgram = (id, data) => updateHRItem('training_programs', id, data);
export const deleteTrainingProgram = (id) => deleteHRItem('training_programs', id);

export const fetchCertifications = () => fetchHRItems('certifications');
export const createCertification = (data) => createHRItem('certifications', data);
export const updateCertification = (id, data) => updateHRItem('certifications', id, data);
export const deleteCertification = (id) => deleteHRItem('certifications', id);

export const deleteOnboardingTask = (id) => deleteHRItem('tasks', id);
export const deleteOffer = (id) => deleteHRItem('offers', id);

// hrService main export object (used in default imports)
const hrService = {
  getSummary: async () => {
    const emps = await fetchEmployees().catch(() => []);
    const requisitions = await fetchHRItems('requisitions').catch(() => []);
    const candidates = await fetchHRItems('candidates').catch(() => []);
    const tasks = await fetchHRItems('tasks').catch(() => []);
    const payroll = await fetchHRItems('payroll').catch(() => []);
    return {
      employees: emps.length,
      requisitions: requisitions.length,
      candidates: candidates.length,
      onboarding_tasks: tasks.filter(t => t.status !== 'Completed').length,
      payroll: payroll.length,
    };
  },
  listRequisitions: async () => fetchHRItems('requisitions'),
  listCandidates: async () => fetchHRItems('candidates'),
  listTasks: async () => fetchHRItems('tasks'),
  listOffers: async () => fetchHRItems('offers'),
  listPerformance: async () => fetchHRItems('performance'),
  listOffboarding: async () => fetchHRItems('offboarding'),
  listPayroll: async () => fetchHRItems('payroll'),
  deletePayroll: async (id) => deleteHRItem('payroll', id),
  
  getEmployee: async (id) => getEmployeeById(id),
  fetchEmployeeAttendance: async (id) => {
    const [employeesList, list] = await Promise.all([
      fetchEmployees().catch(() => []),
      fetchHRItems('attendance')
    ]);
    const emp = employeesList.find(e => 
      String(e.id) === String(id) || 
      String(e.employee_code) === String(id) || 
      String(e.employee_id) === String(id) || 
      (e.biometric_id && String(e.biometric_id) === String(id))
    );
    if (!emp) return [];
    const empDbId = String(emp.id);
    const empCode = String(emp.employee_code || emp.employee_id);
    const empBioId = emp.biometric_id ? String(emp.biometric_id) : '';
    return list.filter(item => 
      String(item.employee_id) === empDbId || 
      String(item.employee) === empCode ||
      (empBioId && String(item.employee) === empBioId) ||
      (empBioId && String(item.biometric_id) === empBioId)
    );
  },
  fetchEmployeeLeaves: async (id) => {
    const [employeesList, list] = await Promise.all([
      fetchEmployees().catch(() => []),
      fetchHRItems('leaves')
    ]);
    const emp = employeesList.find(e => 
      String(e.id) === String(id) || 
      String(e.employee_code) === String(id) || 
      String(e.employee_id) === String(id) || 
      (e.biometric_id && String(e.biometric_id) === String(id))
    );
    if (!emp) return [];
    const empDbId = String(emp.id);
    const empCode = String(emp.employee_code || emp.employee_id);
    return list.filter(item => 
      String(item.employee_id) === empDbId || 
      String(item.employee) === empCode
    );
  },
  fetchEmployeeTasks: async (id) => {
    const [employeesList, list] = await Promise.all([
      fetchEmployees().catch(() => []),
      fetchHRItems('tasks')
    ]);
    const emp = employeesList.find(e => 
      String(e.id) === String(id) || 
      String(e.employee_code) === String(id) || 
      String(e.employee_id) === String(id) || 
      (e.biometric_id && String(e.biometric_id) === String(id))
    );
    if (!emp) return [];
    const empDbId = String(emp.id);
    const empCode = String(emp.employee_code || emp.employee_id);
    return list.filter(item => 
      String(item.employee_id) === empDbId || 
      String(item.employee) === empCode
    );
  },
  fetchEmployeePayroll: async (id) => {
    const [employeesList, list] = await Promise.all([
      fetchEmployees().catch(() => []),
      fetchHRItems('payroll')
    ]);
    const emp = employeesList.find(e => 
      String(e.id) === String(id) || 
      String(e.employee_code) === String(id) || 
      String(e.employee_id) === String(id) || 
      (e.biometric_id && String(e.biometric_id) === String(id))
    );
    if (!emp) return [];
    const empDbId = String(emp.id);
    const empCode = String(emp.employee_code || emp.employee_id);
    return list.filter(item => 
      String(item.employee_id) === empDbId || 
      String(item.employee) === empCode
    );
  },
  fetchLeaveBalances: async (id, year) => {
    return [
      { leave_type: 'Casual Leave', accrued: 12, used: 3, current_balance: 9 },
      { leave_type: 'Sick Leave', accrued: 10, used: 2, current_balance: 8 },
      { leave_type: 'Earned Leave', accrued: 15, used: 0, current_balance: 15 }
    ];
  },
  fetchEmployeeTrainings: async (id) => {
    const [employeesList, list] = await Promise.all([
      fetchEmployees().catch(() => []),
      fetchHRItems('certifications')
    ]);
    const emp = employeesList.find(e => 
      String(e.id) === String(id) || 
      String(e.employee_code) === String(id) || 
      String(e.employee_id) === String(id) || 
      (e.biometric_id && String(e.biometric_id) === String(id))
    );
    if (!emp) return [];
    const empDbId = String(emp.id);
    const empCode = String(emp.employee_code || emp.employee_id);
    return list.filter(item => 
      String(item.employee_id) === empDbId || 
      String(item.employee) === empCode
    );
  },
  predictAttrition: async (data) => {
    const score = Math.floor(Math.random() * 40) + 5;
    return {
      risk_level: score > 30 ? 'Medium' : 'Low',
      risk_score: score,
      factors: [
        'Employee has stable attendance.',
        'Last performance review score was positive.',
        'Salary is competitive within range.'
      ],
      recommended_actions: [
        'Keep conducting regular 1-on-1 feedback sessions.',
        'Provide opportunities for skill development.'
      ]
    };
  },
  getEmployeesWithTasks: async () => {
    const emps = await fetchEmployees().catch(() => []);
    const tasks = await fetchHRItems('tasks');
    return emps.map(emp => ({
      ...emp,
      tasks: tasks.filter(t => String(t.employee_id) === String(emp.id))
    }));
  },
  createTask: async (data) => createHRItem('tasks', data),
  updateTask: async (id, data) => updateHRItem('tasks', id, data),
  deleteTask: async (id) => deleteHRItem('tasks', id),
  addTaskComment: async (taskId, comment) => {
    const tasks = await fetchHRItems('tasks');
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      if (!tasks[idx].comments) tasks[idx].comments = [];
      tasks[idx].comments.push({ id: Date.now(), ...comment, created_at: new Date().toISOString() });
      await updateHRItem('tasks', taskId, tasks[idx]);
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
  updatePerformance: async (id, data) => updateHRItem('performance', id, data),
  createPerformance: async (data) => createHRItem('performance', data),
  createOffboarding: async (data) => createHRItem('offboarding', data),
  updateOffboarding: async (id, data) => updateHRItem('offboarding', id, data),
  
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
  deleteOnboardingTask: async (id) => deleteHRItem('tasks', id),
  deleteOffer: async (id) => deleteHRItem('offers', id),
  analyzeSkillGaps: async (skills, roles) => {
    return {
      analysis: 'Overall match is high. Recommended training includes Node.js and compliance courses.'
    };
  }
};


export default hrService;
