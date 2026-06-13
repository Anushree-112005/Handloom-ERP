// Generic localStorage helpers
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

export const getProjects = async () => {
  const projects = getLocalItems('projects');
  return { data: { projects } };
};

export const createProject = async (data) => {
  const projects = getLocalItems('projects');
  const newProject = { ...data, project_id: Date.now() };
  projects.push(newProject);
  saveLocalItems('projects', projects);
  return { data: newProject };
};

export const updateProject = async (id, data) => {
  const projects = getLocalItems('projects');
  const idx = projects.findIndex(p => p.project_id === id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...data };
    saveLocalItems('projects', projects);
    return { data: projects[idx] };
  }
  throw new Error('Project not found');
};

export const deleteProject = async (id) => {
  const projects = getLocalItems('projects');
  const filtered = projects.filter(p => p.project_id !== id);
  saveLocalItems('projects', filtered);
  return { success: true };
};
