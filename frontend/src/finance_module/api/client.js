import axios from 'axios';

const api = axios.create({
  baseURL: '/api/finance/api',
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cb_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for generic error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // If the backend says "Company not found", it means the active company was deleted.
    // Clear it from localStorage and redirect back to the Company Setup page.
    if (error.response?.status === 404 && error.response?.data?.detail === "Company not found") {
      localStorage.removeItem('cb_company_id');
      localStorage.removeItem('cb_company_name');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    // On 401, clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('cb_auth_token');
      localStorage.removeItem('cb_auth_user');
      localStorage.removeItem('cb_company_id');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
