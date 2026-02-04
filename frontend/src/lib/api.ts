const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    // Check if token expires within next 5 minutes
    return Date.now() >= (exp - 5 * 60 * 1000);
  } catch (error) {
    console.error('Failed to parse token:', error);
    return true;
  }
};

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  try {
    const authData = localStorage.getItem('hopebloom_auth');
    if (authData) {
      const { token } = JSON.parse(authData);
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.warn('Token is expired or expiring soon');
        // Clear expired auth data
        localStorage.removeItem('hopebloom_auth');
        // Redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login?expired=true';
        }
        return null;
      }
      
      return token;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
    localStorage.removeItem('hopebloom_auth');
  }
  return null;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  
  // Handle 401 Unauthorized (token expired or invalid)
  if (res.status === 401) {
    console.warn('Unauthorized request - clearing auth data');
    localStorage.removeItem('hopebloom_auth');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login?expired=true';
    }
    throw new Error('Session expired. Please login again.');
  }
  
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `Request failed: ${res.status}`;
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

// Auth
export const apiAuth = {
  register: (payload: { username: string; email: string; password: string; userType?: string; language?: string }) =>
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
  list: (userId: number | string) => request(`/reminders/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number | string, payload: Record<string, unknown>) =>
    request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number | string) => request(`/reminders/${id}`, { method: 'DELETE' }),
};

// Symptoms
export const apiSymptoms = {
  list: (userId: number | string) => request(`/symptoms/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/symptoms', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number | string, payload: Record<string, unknown>) =>
    request(`/symptoms/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number | string) => request(`/symptoms/${id}`, { method: 'DELETE' }),
};

// Self Exams
export const apiSelfExams = {
  list: (userId: number | string) => request(`/self-exams/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/self-exams', { method: 'POST', body: JSON.stringify(payload) }),
};

// Cycles
export const apiCycles = {
  list: (userId: number | string) => request(`/cycles/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/cycles', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number | string, payload: Record<string, unknown>) =>
    request(`/cycles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number | string) => request(`/cycles/${id}`, { method: 'DELETE' }),
};

// Medications
export const apiMedications = {
  list: (userId: number | string) => request(`/medications/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request('/medications', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number | string, payload: Record<string, unknown>) =>
    request(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number | string) => request(`/medications/${id}`, { method: 'DELETE' }),
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

// Reports
export const apiReports = {
  getDoctorReport: (userId: number) => request(`/reports/doctor/${userId}`),
};

// AI Assistant
export const apiAI = {
  chat: async (payload: { prompt: string; system?: string; history?: any[] }) => {
    const controller = new AbortController();
    const timeoutMs = 45000;
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await request<{ text: string }>(
        '/ai/chat',
        { method: 'POST', body: JSON.stringify(payload), signal: controller.signal },
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
};

// Journal
export const apiJournal = {
  list: (userId: number) => request(`/journal/${userId}`),
  get: (userId: number, entryId: number) => request(`/journal/${userId}/${entryId}`),
  create: (payload: Record<string, unknown>) =>
    request('/journal', { method: 'POST', body: JSON.stringify(payload) }),
  update: (entryId: number, payload: Record<string, unknown>) =>
    request(`/journal/${entryId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (entryId: number) => request(`/journal/${entryId}`, { method: 'DELETE' }),
};

// Progress Logs
export const apiProgress = {
  list: (userId: number) => request(`/progress/${userId}`),
  getByActivity: (userId: number, activityType: string) =>
    request(`/progress/${userId}/activity/${activityType}`),
  create: (payload: Record<string, unknown>) =>
    request('/progress', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (logId: number) => request(`/progress/${logId}`, { method: 'DELETE' }),
};
