/**
 * Chatbot API Service — communicates with backend /api/v1/chat/* and /api/v1/reports/*
 */
import api, { API_BASE } from './api';

export const chatbotAPI = {
  /** Send a message and get AI response with optional report attachments */
  sendMessage: (threadId, message, context = {}) =>
    api.post('/chat/messages', { thread_id: threadId, message, context }),

  /** Retrieve conversation history for a thread */
  getHistory: (threadId) =>
    api.get(`/chat/threads/${threadId}`),
};

export const reportsAPI = {
  /** Get catalog of all available report templates */
  getTemplates: () =>
    api.get('/reports/templates'),

  /** Generate a report (returns job with download URL) */
  generate: (reportId, format = 'pdf', filters = {}) =>
    api.post('/reports/generate', { report_id: reportId, format, filters }),

  /** Check status of a report job */
  getJob: (jobId) =>
    api.get(`/reports/jobs/${jobId}`),

  /** Download a completed report */
  downloadUrl: (jobId) =>
    `${API_BASE}/reports/jobs/${jobId}/download`,
};

/**
 * Download a report file using the auth token.
 * Opens a blob URL in a new tab / triggers download.
 */
export const downloadReport = async (jobId, format = 'pdf') => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/reports/jobs/${jobId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  
  let filename = 'report';
  if (filenameMatch) {
    filename = filenameMatch[1];
  } else {
    const ext = format === 'excel' ? 'xlsx' : format;
    filename = `report_${jobId}.${ext}`;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default chatbotAPI;
