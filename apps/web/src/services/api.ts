import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('queryspeak_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export interface UserOut {
  id: number;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface QueryGenerateResponse {
  natural_language_query: string;
  generated_sql: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  execution_time_ms: number;
  was_successful: boolean;
  error?: string;
}

export async function registerUser(email: string, password: string, fullName?: string): Promise<UserOut> {
  const res = await apiClient.post<UserOut>('/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>('/auth/login', {
    email,
    password,
  });
  return res.data;
}

export async function getCurrentUser(): Promise<UserOut> {
  const res = await apiClient.get<UserOut>('/auth/me');
  return res.data;
}

export async function generateQuery(prompt: string): Promise<QueryGenerateResponse> {
  const res = await apiClient.post<QueryGenerateResponse>('/query/generate', {
    prompt,
  });
  return res.data;
}
