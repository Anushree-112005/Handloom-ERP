/**
 * Chatbot API Service — communicates with backend /api/v1/chat/* and /api/v1/reports/*
 */
import api from './api';

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
    `/api/v1/reports/jobs/${jobId}/download`,
};

/**
 * Download a report file using the auth token.
 * Opens a blob URL in a new tab / triggers download.
 */
export async function downloadReport(downloadUrl) {
  const token = localStorage.getItem('token');
  const response = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch ? filenameMatch[1] : 'report';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default chatbotAPI;
