const DEFAULT_API_BASE = '/api';
const ENV_API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL;
const REQUIRE_LOGIN_ALWAYS = String(import.meta.env.VITE_REQUIRE_LOGIN_ALWAYS || '').toLowerCase() === 'true';
const DEV_OFFLINE = String(import.meta.env.VITE_DEV_OFFLINE || '').toLowerCase() === 'true';
const API_BASE = ENV_API_BASE || DEFAULT_API_BASE;
type LocalCycle = { id: number; user_id: number; start_date: string; end_date?: string; cycle_length?: number; notes?: string };
const getLocalCycles = (userId: number) => {
  const raw = localStorage.getItem('hb_cycles');
  const all: Record<string, LocalCycle[]> = raw ? JSON.parse(raw) : {};
  return all[String(userId)] || [];
};
const setLocalCycles = (userId: number, cycles: LocalCycle[]) => {
  const raw = localStorage.getItem('hb_cycles');
  const all: Record<string, LocalCycle[]> = raw ? JSON.parse(raw) : {};
  all[String(userId)] = cycles;
  localStorage.setItem('hb_cycles', JSON.stringify(all));
};
const LOGIN_HASH_PATH = '#/login?expired=true';

const redirectToLogin = () => {
  const isHashRouting = window.location.hash.startsWith('#/') || window.location.protocol === 'file:';
  window.location.href = isHashRouting ? LOGIN_HASH_PATH : '/login?expired=true';
};

// Check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string') return true;
    // In offline/dev mode or non-JWT tokens, skip expiry enforcement
    if (token.indexOf('.') === -1 || String(import.meta.env.VITE_DEV_OFFLINE || '').toLowerCase() === 'true') {
      return false;
    }
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= (exp - 5 * 60 * 1000);
  } catch (error) {
    console.warn('Failed to parse token:', error);
    // Treat as non-expiring in dev offline to avoid forced logout
    if (String(import.meta.env.VITE_DEV_OFFLINE || '').toLowerCase() === 'true') return false;
    return true;
  }
};

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  try {
    if (REQUIRE_LOGIN_ALWAYS) {
      // Use session-only token; do not auto-login from localStorage
      const sessionAuth = sessionStorage.getItem('hopebloom_auth');
      if (sessionAuth) {
        try {
          const { token } = JSON.parse(sessionAuth);
          return token || null;
        } catch {
          sessionStorage.removeItem('hopebloom_auth');
        }
      }
      return null;
    }
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
          redirectToLogin();
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
    try { localStorage.removeItem('hopebloom_auth'); } catch {}
    try { sessionStorage.removeItem('hopebloom_auth'); } catch {}
    if (!String(import.meta.env.VITE_DEV_OFFLINE || '').toLowerCase().startsWith('t')) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        redirectToLogin();
      }
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
  register: async (payload: { username: string; email: string; password: string; phone?: string; userType?: string; language?: string }) => {
    try {
      return await request('/users/register', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err: any) {
      // Fallback local registration for development when backend is unavailable
      const usersRaw = localStorage.getItem('hb_users');
      const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];
      if (users.find(u => u.email === payload.email)) {
        throw new Error('Email is already registered.');
      }
      const id = Date.now();
      const user = {
        id,
        username: payload.username,
        email: payload.email,
        phone: payload.phone || null,
        userType: payload.userType || 'wellness',
        language: payload.language || 'en',
        password: payload.password,
        token: Math.random().toString(36).slice(2),
      };
      users.push(user);
      localStorage.setItem('hb_users', JSON.stringify(users));
      return user;
    }
  },
  login: async (payload: { email: string; password: string }) => {
    try {
      return await request('/users/login', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err: any) {
      const usersRaw = localStorage.getItem('hb_users');
      const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];
      const user = users.find(u => String(u.email).toLowerCase() === String(payload.email).toLowerCase());
      if (!user || user.password !== payload.password) {
        throw new Error('Invalid credentials.');
      }
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || null,
        userType: user.userType || 'wellness',
        language: user.language || 'en',
        token: user.token || Math.random().toString(36).slice(2),
      };
    }
  },
  getByEmail: (email: string) => request(`/users/${encodeURIComponent(email)}`),
};

// Profile
export const apiProfile = {
  upsert: async (payload: {
    userId: number;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    country?: string;
    age?: number;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    medicalHistory?: string;
  }) => {
    try {
      return await request('/profiles', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      const key = `hb_profile_${payload.userId}`;
      const existingRaw = localStorage.getItem(key);
      const prev = existingRaw ? JSON.parse(existingRaw) : {};
      const next = {
        user_id: payload.userId,
        first_name: payload.firstName ?? prev.first_name ?? '',
        last_name: payload.lastName ?? prev.last_name ?? '',
        date_of_birth: payload.dateOfBirth ?? prev.date_of_birth ?? '',
        gender: payload.gender ?? prev.gender ?? '',
        country: payload.country ?? prev.country ?? '',
        age: payload.age ?? prev.age ?? undefined,
        phone: payload.phone ?? prev.phone ?? '',
        address: payload.address ?? prev.address ?? '',
        emergencyContact: payload.emergencyContact ?? prev.emergencyContact ?? '',
        medicalHistory: payload.medicalHistory ?? prev.medicalHistory ?? '',
      };
      localStorage.setItem(key, JSON.stringify(next));
      return { message: 'Profile updated locally.' } as any;
    }
  },
  get: async (userId: number) => {
    try {
      const raw = await request(`/profiles/${userId}`);
      const normalized = {
        user_id: raw.user_id ?? raw.userId ?? raw.id,
        first_name: raw.first_name ?? raw.firstName ?? '',
        last_name: raw.last_name ?? raw.lastName ?? '',
        date_of_birth: raw.date_of_birth ?? raw.dateOfBirth ?? '',
        gender: raw.gender ?? '',
        country: raw.country ?? '',
        medicalHistory: raw.medical_history ?? raw.medicalHistory ?? '',
      };
      return normalized;
    } catch (err) {
      const key = `hb_profile_${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
      // Construct from auth user if profile not saved yet
      const authRaw = localStorage.getItem('hopebloom_auth');
      if (authRaw) {
        const a = JSON.parse(authRaw);
        return {
          user_id: a.id,
          first_name: a.username || '',
          last_name: '',
          date_of_birth: '',
          gender: a.gender || 'Female',
          country: '',
          age: undefined,
          phone: '',
          address: '',
          emergencyContact: '',
          medicalHistory: '',
        };
      }
      throw err;
    }
  },
};

// Reminders
// Reminders
export const apiReminders = {
  list: async (userId: number | string) => {
    const key = `hb_reminders_${userId}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    if (DEV_OFFLINE) return readLocal();
    try {
      return await request(`/reminders/${userId}`);
    } catch {
      return readLocal();
    }
  },
  create: async (payload: any) => {
    const uid = String(payload.user_id ?? payload.userId);
    const key = `hb_reminders_${uid}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal();
      const id = Date.now();
      items.push({ id, ...payload, created_at: new Date().toISOString() });
      writeLocal(items);
      return { id } as any;
    }
    try {
      return await request('/reminders', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      const items = readLocal();
      const id = Date.now();
      items.push({ id, ...payload, created_at: new Date().toISOString() });
      writeLocal(items);
      return { id } as any;
    }
  },
  update: async (id: number | string, payload: any) => {
    const uid = String(payload.user_id ?? payload.userId ?? 'default');
    const key = `hb_reminders_${uid}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal().map((r: any) => (r.id === Number(id) ? { ...r, ...payload } : r));
      writeLocal(items);
      return { success: true } as any;
    }
    try {
      return await request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } catch {
      const items = readLocal().map((r: any) => (r.id === Number(id) ? { ...r, ...payload } : r));
      writeLocal(items);
      return { success: true } as any;
    }
  },
  remove: async (id: number | string, userId?: number | string) => {
    const key = `hb_reminders_${String(userId ?? 'default')}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal().filter((r: any) => r.id !== Number(id));
      writeLocal(items);
      return { success: true } as any;
    }
    try {
      return await request(`/reminders/${id}`, { method: 'DELETE' });
    } catch {
      const items = readLocal().filter((r: any) => r.id !== Number(id));
      writeLocal(items);
      return { success: true } as any;
    }
  },
  complete: async (payload: { user_id: number | string; type: 'water' | 'medication' }) => {
    const key = `hb_reminder_completions_${String(payload.user_id)}`;
    if (DEV_OFFLINE) {
      const raw = localStorage.getItem(key);
      const items = raw ? JSON.parse(raw) : [];
      items.push({ ...payload, completed_at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(items));
      return { success: true } as any;
    }
    try {
      return await request('/reminders/complete', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      const raw = localStorage.getItem(key);
      const items = raw ? JSON.parse(raw) : [];
      items.push({ ...payload, completed_at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(items));
      return { success: true } as any;
    }
  },
};

// Symptoms
export const apiSymptoms = {
  list: async (userId: number | string) => {
    const key = `hb_symptoms_${userId}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    if (DEV_OFFLINE) return readLocal();
    try {
      return await request(`/symptoms/${userId}`);
    } catch {
      return readLocal();
    }
  },
  create: async (payload: any & { user_id?: number | string }) => {
    const uid = String(payload.user_id ?? payload.userId ?? 'default');
    const key = `hb_symptoms_${uid}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal();
      const id = Date.now();
      items.push({ id, ...(payload as any), created_at: new Date().toISOString() });
      writeLocal(items);
      return { id } as any;
    }
    try {
      return await request('/symptoms', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      const items = readLocal();
      const id = Date.now();
      items.push({ id, ...(payload as any), created_at: new Date().toISOString() });
      writeLocal(items);
      return { id } as any;
    }
  },
  update: async (id: number | string, payload: Record<string, unknown> & { user_id?: number | string }) => {
    const uid = String((payload as any).user_id ?? (payload as any).userId ?? 'default');
    const key = `hb_symptoms_${uid}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal().map((r: any) => (r.id === Number(id) ? { ...r, ...payload } : r));
      writeLocal(items);
      return { success: true } as any;
    }
    try {
      return await request(`/symptoms/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } catch {
      const items = readLocal().map((r: any) => (r.id === Number(id) ? { ...r, ...payload } : r));
      writeLocal(items);
      return { success: true } as any;
    }
  },
  remove: async (id: number | string, userId?: number | string) => {
    const key = `hb_symptoms_${String(userId ?? 'default')}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal().filter((r: any) => r.id !== Number(id));
      writeLocal(items);
      return { success: true } as any;
    }
    try {
      return await request(`/symptoms/${id}`, { method: 'DELETE' });
    } catch {
      const items = readLocal().filter((r: any) => r.id !== Number(id));
      writeLocal(items);
      return { success: true } as any;
    }
  },
};

// Self Exams
export const apiSelfExams = {
  list: async (userId: number | string) => {
    const key = `hb_self_exams_${String(userId)}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    try {
      return await request(`/self-exams/${userId}`);
    } catch {
      return readLocal();
    }
  },
  create: async (payload: any) => {
    const uid = String(payload.user_id ?? payload.userId);
    const key = `hb_self_exams_${uid}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    try {
      return await request('/self-exams', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      const items = readLocal();
      const id = Date.now();
      items.push({ id, ...(payload as any), created_at: new Date().toISOString() });
      writeLocal(items);
      return { id } as any;
    }
  },
  mandatoryStatus: async (userId: number | string) => {
    try {
      return await request(`/self-exams/mandatory-status/${userId}`);
    } catch {
      const uid = Number(userId);
      const cycles = getLocalCycles(uid);
      const latest = cycles.sort((a,b)=>String(b.start_date).localeCompare(String(a.start_date)))[0];
      if (latest?.end_date) {
        const end = new Date(latest.end_date);
        const next = new Date(end.getTime());
        next.setDate(next.getDate()+1);
        const today = new Date();
        const sameDay = next.toDateString() === today.toDateString();
        return { required: sameDay, requiredFrom: next.toISOString().split('T')[0] } as any;
      }
      return { required: false } as any;
    }
  },
};

// Cycles
export const apiCycles = {
  list: async (userId: number | string) => {
    try {
      return await request(`/cycles/${userId}`);
    } catch {
      const uid = Number(userId);
      return getLocalCycles(uid);
    }
  },
  create: async (payload: any) => {
    try {
      return await request('/cycles', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      const uid = Number(payload.user_id ?? payload.userId);
      const cycles = getLocalCycles(uid);
      const item: LocalCycle = {
        id: Date.now(),
        user_id: uid,
        start_date: String(payload.start_date ?? payload.startDate),
        end_date: ((payload.end_date ?? payload.endDate) ? String(payload.end_date ?? payload.endDate) : undefined),
        cycle_length: Number(payload.cycle_length ?? payload.cycleLength) || undefined,
        notes: String(payload.notes || '') || undefined,
      };
      cycles.unshift(item);
      setLocalCycles(uid, cycles);
      return { id: item.id, data: { id: item.id } } as any;
    }
  },
  update: async (id: number | string, payload: any) => {
    try {
      return await request(`/cycles/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } catch {
      const allRaw = localStorage.getItem('hb_cycles');
      const all: Record<string, LocalCycle[]> = allRaw ? JSON.parse(allRaw) : {};
      Object.keys(all).forEach(k => {
        all[k] = (all[k] || []).map(c => c.id === Number(id)
          ? { ...c, end_date: String(((payload.end_date ?? payload.endDate) || c.end_date)) }
          : c);
      });
      localStorage.setItem('hb_cycles', JSON.stringify(all));
      return { success: true } as any;
    }
  },
  remove: (id: number | string) => request(`/cycles/${id}`, { method: 'DELETE' }),
};

// Medications
export const apiMedications = {
  list: async (userId: number | string) => {
    const key = `hb_medications_${userId}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    if (DEV_OFFLINE) return readLocal();
    try {
      return await request(`/medications/${userId}`);
    } catch {
      return readLocal();
    }
  },
  create: async (payload: any & { userId?: number | string; user_id?: number | string }) => {
    const uid = String(payload.user_id ?? payload.userId ?? 'default');
    const key = `hb_medications_${uid}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal();
      const id = Date.now();
      items.push({
        id,
        user_id: uid,
        name: payload.name,
        dosage: payload.dosage,
        frequency: payload.frequency,
        type: payload.type,
        time_of_day: payload.timeOfDay ?? payload.time ?? '',
        instructions: payload.instructions ?? payload.notes ?? '',
        created_at: new Date().toISOString(),
      });
      writeLocal(items);
      return { id } as any;
    }
    try {
      return await request('/medications', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      const items = readLocal();
      const id = Date.now();
      items.push({
        id,
        user_id: uid,
        name: payload.name,
        dosage: payload.dosage,
        frequency: payload.frequency,
        type: payload.type,
        time_of_day: payload.timeOfDay ?? payload.time ?? '',
        instructions: payload.instructions ?? payload.notes ?? '',
        created_at: new Date().toISOString(),
      });
      writeLocal(items);
      return { id } as any;
    }
  },
  update: async (id: number | string, payload: any & { userId?: number | string; user_id?: number | string }) => {
    const uid = String(payload.user_id ?? payload.userId ?? 'default');
    const key = `hb_medications_${uid}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    const writeLocal = (items: any[]) => localStorage.setItem(key, JSON.stringify(items));
    if (DEV_OFFLINE) {
      const items = readLocal().map((m: any) => (m.id === Number(id) ? { ...m, ...payload } : m));
      writeLocal(items);
      return { success: true } as any;
    }
    try {
      return await request(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } catch {
      const items = readLocal().map((m: any) => (m.id === Number(id) ? { ...m, ...payload } : m));
      writeLocal(items);
      return { success: true } as any;
    }
  },
  remove: async (id: number | string) => {
    // Attempt local removal across all user keys if backend fails or offline
    const removeAcrossAll = () => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('hb_medications_'));
      keys.forEach((k) => {
        try {
          const raw = localStorage.getItem(k);
          const items = raw ? JSON.parse(raw) : [];
          const next = items.filter((m: any) => m.id !== Number(id));
          localStorage.setItem(k, JSON.stringify(next));
        } catch {}
      });
    };
    if (DEV_OFFLINE) {
      removeAcrossAll();
      return { success: true } as any;
    }
    try {
      return await request(`/medications/${id}`, { method: 'DELETE' });
    } catch {
      removeAcrossAll();
      return { success: true } as any;
    }
  },
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
  uploadMedicalReport: async (file: File, userId?: number) => {
    const token = getAuthToken();
    const form = new FormData();
    form.append('file', file);
    if (userId) form.append('user_id', String(userId));
    const res = await fetch(`${API_BASE}/report-analysis/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Upload failed');
    }
    return res.json();
  },
};

// WhatsApp (Twilio/Webhook/N8N provider at backend)
export const apiWhatsApp = {
  send: async (payload: { to: string; body: string; contentSid?: string; contentVariables?: any }) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Failed');
      throw new Error(text || 'Failed to send WhatsApp');
    }
    return res.json();
  },
};

// Lightweight API wrapper for arbitrary endpoints
export const api = {
  async get<T>(path: string) {
    return request<T>(path, { method: 'GET' });
  },
  async post<T>(path: string, body: Record<string, unknown>) {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },
  async put<T>(path: string, body: Record<string, unknown>) {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  async del<T>(path: string) {
    return request<T>(path, { method: 'DELETE' });
  }
};

// AI Assistant
export const apiAI = {
  chat: async (payload: { prompt: string; system?: string; history?: any[]; mode?: 'health' | 'psych' }) => {
    const controller = new AbortController();
    const timeoutMs = 45000;
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const mode = String(payload.mode || '').toLowerCase();
    const module = mode === 'psych' ? 'survivorship' : 'breast_cancer';

    try {
      const body = {
        prompt: payload.prompt,
        system: payload.system || '',
        history: payload.history || [],
        mode,
      } as any;
      return await request('/ai/chat', { method: 'POST', body: JSON.stringify(body), signal: controller.signal });
    } catch (err) {
      // Fallback: call Rasa REST directly when backend is unavailable or 401
      try {
        const rasaUrl = (import.meta.env.VITE_RASA_URL as string) || 'http://localhost:5005/webhooks/rest/webhook';
        const sender = 'web_user';
        const payloadBody = { sender, message: `${module.toUpperCase()}: ${payload.prompt}` };
        const res = await fetch(rasaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadBody),
          signal: controller.signal,
        });
        const data = await res.json();
        const text = Array.isArray(data) ? data.map((d: any) => d?.text).filter(Boolean).join('\n') : '';
        return { success: true, provider: 'rasa', fallback: true, text, data: { text } } as any;
      } catch (e) {
        throw err;
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
};

export const apiCycleInsights = {
  predict: async (payload: { firstDay?: string; cycleLength?: number }) => {
    const host = (import.meta.env.VITE_RAPIDAPI_HOST as string) || 'womens-health-menstrual-cycle-phase-predictions-insights.p.rapidapi.com';
    const key = (import.meta.env.VITE_RAPIDAPI_KEY as string) || '';
    const url = `https://${host}/`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': key,
      },
    });
    try {
      const data = await res.json();
      return data;
    } catch {
      return {} as any;
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
  list: async (userId: number) => {
    const key = `hb_progress_${userId}`;
    const readLocal = () => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };
    if (DEV_OFFLINE) return readLocal();
    try {
      return await request(`/progress/${userId}`);
    } catch {
      return readLocal();
    }
  },
  getByActivity: async (userId: number, activityType: string) => {
    const items = await apiProgress.list(userId);
    return (items as any[]).filter((i) => i.activity_type === activityType);
  },
  create: async (payload: Record<string, unknown> & { user_id: number }) => {
    const key = `hb_progress_${payload.user_id}`;
    const raw = localStorage.getItem(key);
    const items = raw ? JSON.parse(raw) : [];
    if (DEV_OFFLINE) {
      const id = Date.now();
      items.push({ id, ...(payload as any), created_at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(items));
      return { id } as any;
    }
    try {
      return await request('/progress', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      const id = Date.now();
      items.push({ id, ...(payload as any), created_at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(items));
      return { id } as any;
    }
  },
  remove: async (logId: number, userId?: number) => {
    const key = `hb_progress_${userId ?? 'default'}`;
    const raw = localStorage.getItem(key);
    const items = raw ? JSON.parse(raw) : [];
    if (DEV_OFFLINE) {
      const next = items.filter((i: any) => i.id !== logId);
      localStorage.setItem(key, JSON.stringify(next));
      return { success: true } as any;
    }
    try {
      return await request(`/progress/${logId}`, { method: 'DELETE' });
    } catch {
      const next = items.filter((i: any) => i.id !== logId);
      localStorage.setItem(key, JSON.stringify(next));
      return { success: true } as any;
    }
  },
};
