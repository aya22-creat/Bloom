const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const apiAuth = {
  register: (payload: { username: string; email: string; password: string }) =>
    request('/users/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request('/users/login', { method: 'POST', body: JSON.stringify(payload) }),
  getByEmail: (email: string) => request(`/users/${encodeURIComponent(email)}`),
};

// Profile
export const apiProfile = {
  upsert: (payload: {
    userId: number;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    country?: string;
  }) => request('/profiles', { method: 'POST', body: JSON.stringify(payload) }),
  get: (userId: number) => request(`/profiles/${userId}`),
};

// Reminders
// Reminders
export const apiReminders = {
  list: (userId: number) => request(`/reminders/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Record<string, unknown>) =>
    request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => request(`/reminders/${id}`, { method: 'DELETE' }),
};

// Symptoms
export const apiSymptoms = {
  list: (userId: number) => request(`/symptoms/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/symptoms', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Record<string, unknown>) =>
    request(`/symptoms/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => request(`/symptoms/${id}`, { method: 'DELETE' }),
};

// Self Exams
export const apiSelfExams = {
  list: (userId: number) => request(`/self-exams/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/self-exams', { method: 'POST', body: JSON.stringify(payload) }),
};

// Cycles
export const apiCycles = {
  list: (userId: number) => request(`/cycles/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/cycles', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Record<string, unknown>) =>
    request(`/cycles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => request(`/cycles/${id}`, { method: 'DELETE' }),
};

// Medications
export const apiMedications = {
  list: (userId: number) => request(`/medications/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/medications', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Record<string, unknown>) =>
    request(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => request(`/medications/${id}`, { method: 'DELETE' }),
};

// Medication Logs
export const apiMedicationLogs = {
  list: (medicationId: number) => request(`/medication-logs/${medicationId}`),
  create: (payload: Record<string, unknown>) =>
    request('/medication-logs', { method: 'POST', body: JSON.stringify(payload) }),
};

// Questionnaire
export const apiQuestionnaire = {
  list: (userId: number) => request(`/questionnaire/${userId}`),
  submit: (payload: Record<string, unknown>) =>
    request('/questionnaire', { method: 'POST', body: JSON.stringify(payload) }),
};

// AI Assistant
export const apiAI = {
  chat: (payload: { prompt: string; system?: string }) =>
    request<{ text: string }>(
      '/ai/chat',
      { method: 'POST', body: JSON.stringify(payload) },
    ),
};