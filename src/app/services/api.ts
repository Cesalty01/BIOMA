/**
 * Serviço de API - Integração Frontend ↔ Backend
 * Backend: http://localhost:3001
 * Fallback automático para dados simulados quando o backend não está disponível
 */

const API_BASE = 'http://localhost:3001/api';

let authToken: string | null = null;
let backendAvailable: boolean | null = null; // null = não testado ainda

// ─── Token de Autenticação ─────────────────────────────────────────────────

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('ph_token', token);
  } else {
    localStorage.removeItem('ph_token');
  }
}

export function loadSavedToken(): string | null {
  const saved = localStorage.getItem('ph_token');
  if (saved) authToken = saved;
  return saved;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('ph_token');
  localStorage.removeItem('ph_user');
}

// ─── Headers ───────────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// ─── Request Base ──────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers as Record<string, string> || {}) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro de rede' }));
    throw new Error(error.error || `Erro HTTP ${response.status}`);
  }

  return response.json();
}

// Objeto de API genérico para componentes customizados
export const api = {
  get: <T>(path: string, options?: RequestInit & { params?: Record<string, any> }) => {
    let url = path;
    if (options?.params) {
      const qs = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined) qs.append(k, String(v));
      });
      url += `?${qs.toString()}`;
    }
    return request<T>(url, { ...options, method: 'GET' });
  },
  post: <T>(path: string, body: any, options?: RequestInit) => request<T>(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  }),
};

// ─── Verificar disponibilidade do backend ─────────────────────────────────

export async function checkBackendAvailability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    backendAvailable = response.ok;
    return backendAvailable;
  } catch {
    backendAvailable = false;
    return false;
  }
}

export function isBackendAvailable(): boolean {
  return backendAvailable === true;
}

// ─── Dados Simulados (Fallback) ────────────────────────────────────────────

const mockUsers = [
  { id: 1, email: 'admin@precisionhealth.com', password: 'admin123', name: 'Dra. Ana Santos', role: 'admin' },
  { id: 2, email: 'doctor@clinic.com', password: '123456', name: 'Dr. Carlos Mendes', role: 'doctor' },
];

let mockTriages: any[] = [
  {
    id: 1, patient_id: 'PT-2847', full_name: 'Beatriz Silva',
    date_of_birth: '1970-03-15', phone_contact: '+351 912 345 678',
    lump_detected: 1, breast_pain: 0, skin_changes: 1, nipple_discharge: 1,
    family_history: 1, previous_diagnosis: 0, observations: 'Nódulo endurecido há 3 meses',
    heart_rate: 78, spo2: 97, temperature: 37.1,
    risk_score: 9, risk_level: 'high', created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2, patient_id: 'PT-2903', full_name: 'Marcos Lima',
    date_of_birth: '1985-07-22', phone_contact: '+351 965 432 109',
    lump_detected: 0, breast_pain: 1, skin_changes: 0, nipple_discharge: 0,
    family_history: 1, previous_diagnosis: 0, observations: '',
    heart_rate: 72, spo2: 98, temperature: 36.8,
    risk_score: 3, risk_level: 'low', created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 3, patient_id: 'PT-2891', full_name: 'Sarah Tavares',
    date_of_birth: '1992-11-08', phone_contact: '+351 934 567 890',
    lump_detected: 0, breast_pain: 0, skin_changes: 0, nipple_discharge: 0,
    family_history: 1, previous_diagnosis: 0, observations: 'Histórico materno de cancro da mama',
    heart_rate: 68, spo2: 99, temperature: 36.5,
    risk_score: 2, risk_level: 'low', created_at: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 4, patient_id: 'PT-2874', full_name: 'Julian De Ora',
    date_of_birth: '1968-05-30', phone_contact: '+351 923 456 789',
    lump_detected: 1, breast_pain: 1, skin_changes: 0, nipple_discharge: 0,
    family_history: 0, previous_diagnosis: 1, observations: 'Diagnóstico anterior de quisto benigno',
    heart_rate: 81, spo2: 96, temperature: 36.9,
    risk_score: 7, risk_level: 'high', created_at: new Date(Date.now() - 345600000).toISOString()
  },
  {
    id: 5, patient_id: 'PT-2856', full_name: 'Ana Costa',
    date_of_birth: '1975-09-14', phone_contact: '+351 915 678 901',
    lump_detected: 1, breast_pain: 1, skin_changes: 1, nipple_discharge: 1,
    family_history: 1, previous_diagnosis: 1, observations: 'Caso urgente - múltiplos sintomas',
    heart_rate: 92, spo2: 95, temperature: 37.5,
    risk_score: 13, risk_level: 'high', created_at: new Date(Date.now() - 432000000).toISOString()
  },
  {
    id: 6, patient_id: 'PT-2845', full_name: 'Pedro Santos',
    date_of_birth: '1980-02-28', phone_contact: '+351 961 234 567',
    lump_detected: 0, breast_pain: 0, skin_changes: 0, nipple_discharge: 0,
    family_history: 0, previous_diagnosis: 0, observations: 'Exame de rotina',
    heart_rate: 65, spo2: 99, temperature: 36.4,
    risk_score: 0, risk_level: 'low', created_at: new Date(Date.now() - 518400000).toISOString()
  },
];

let nextMockId = 7;

function generateMockToken(user: any): string {
  return btoa(JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, exp: Date.now() + 86400000 }));
}

// ─── API de Autenticação ───────────────────────────────────────────────────

export const authAPI = {
  /**
   * Login - tenta backend, fallback para mock
   */
  login: async (email: string, password: string): Promise<{ token: string; user: any }> => {
    try {
      const result = await request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      backendAvailable = true;
      return result;
    } catch (err: any) {
      // Fallback: aceitar qualquer email/senha (modo demo) ou verificar mock
      const mockUser = mockUsers.find(u => u.email === email && u.password === password);
      if (mockUser || (email && password)) {
        const user = mockUser || { id: 99, email, name: email.split('@')[0], role: 'doctor' };
        const token = generateMockToken(user);
        return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      }
      throw new Error('Credenciais inválidas');
    }
  },

  /**
   * Registo - tenta backend, fallback para mock
   */
  register: async (name: string, email: string, password: string, specialty?: string, role?: string): Promise<{ token: string; user: any }> => {
    try {
      const result = await request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, specialty, role }),
      });
      backendAvailable = true;
      return result;
    } catch {
      // Verificar se email já existe nos mocks
      if (mockUsers.find(u => u.email === email)) {
        throw new Error('Email já registado');
      }
      // Criar utilizador mock
      const newUser = { id: Date.now(), email, password, name, role: 'doctor' };
      mockUsers.push(newUser);
      const token = generateMockToken(newUser);
      return { token, user: { id: newUser.id, email, name, role: 'doctor' } };
    }
  },
};

// ─── API de Triagens ───────────────────────────────────────────────────────

export const triagesAPI = {
  /**
   * Criar nova triagem
   */
  create: async (data: any): Promise<any> => {
    try {
      const result = await request<any>('/triages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      backendAvailable = true;
      return result;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar triagem');
    }
  },

  /**
   * Listar triagens
   */
  list: async (params?: { patient_id?: string; risk_level?: string; limit?: number }): Promise<any[]> => {
    try {
      const searchParams = params ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
      ) : '';
      const result = await request<any[]>(`/triages${searchParams}`);
      backendAvailable = true;
      return result;
    } catch {
      return [];
    }
  },

  /**
   * Estatísticas
   */
  stats: async (): Promise<any> => {
    try {
      const result = await request<any>('/triages/stats/overview');
      backendAvailable = true;
      return result;
    } catch {
      return {
        totalTriages: 0,
        averageRiskScore: '0.0',
        highRiskCases: 0,
        riskDistribution: { high: 0, medium: 0, low: 0 },
      };
    }
  },
};

// ─── API de Sensores IoT ───────────────────────────────────────────────────
export const sensorsAPI = {
  /**
   * Dados mais recentes dos sensores
   */
  latest: async (): Promise<{ heartRate: number; spo2: number; temperature: number; connected: boolean; timestamp: string | null }> => {
    try {
      const result = await request<{ heartRate: number; spo2: number; temperature: number; connected: boolean; timestamp: string }>('/sensors/latest');
      backendAvailable = true;
      return result;
    } catch {
      // Retornar valores zerados se o backend estiver offline
      return {
        heartRate: 0,
        spo2: 0,
        temperature: 0,
        connected: false,
        timestamp: new Date().toISOString(),
      };
    }
  },
};
