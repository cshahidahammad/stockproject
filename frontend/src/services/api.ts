import {
  AuthResponse,
  ChartsResponse,
  DatasetMeta,
  DatasetSummary,
  HealthResponse,
  LoginPayload,
  PredictionResult,
  SignUpPayload,
  StockAnalysisResponse,
  UploadResponse,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const TOKEN_KEY = 'stock_market_auth_token';

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage unavailable
    }
  },
};

function getAuthHeaders(extraHeaders: HeadersInit = {}): Record<string, string> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return {
    ...headers,
    ...(extraHeaders as Record<string, string>),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      errorMsg = res.statusText || errorMsg;
    }

    if (res.status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // --- Authentication ---
  async signup(payload: SignUpPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(res);
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(res);
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    const token = tokenStorage.get();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      }
    } finally {
      tokenStorage.clear();
    }
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  // --- Health & Dataset ---
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getDefaultDataset(): Promise<DatasetMeta> {
    const res = await fetch(`${API_BASE_URL}/api/dataset/default`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DatasetMeta>(res);
  },

  async uploadDataset(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/dataset/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    return handleResponse<UploadResponse>(res);
  },

  async getDatasetSummary(datasetId: string): Promise<DatasetSummary> {
    const res = await fetch(`${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/summary`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DatasetSummary>(res);
  },

  async getDatasetAnalysis(
    datasetId: string,
    params?: { startDate?: string; endDate?: string; page?: number; pageSize?: number }
  ): Promise<StockAnalysisResponse> {
    const url = new URL(`${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/analysis`);
    if (params?.startDate) url.searchParams.append('start_date', params.startDate);
    if (params?.endDate) url.searchParams.append('end_date', params.endDate);
    if (params?.page) url.searchParams.append('page', params.page.toString());
    if (params?.pageSize) url.searchParams.append('page_size', params.pageSize.toString());

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    return handleResponse<StockAnalysisResponse>(res);
  },

  async getDatasetCharts(
    datasetId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<ChartsResponse> {
    const url = new URL(`${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/charts`);
    if (params?.startDate) url.searchParams.append('start_date', params.startDate);
    if (params?.endDate) url.searchParams.append('end_date', params.endDate);

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    return handleResponse<ChartsResponse>(res);
  },

  async predictDatasetTrend(datasetId: string): Promise<PredictionResult> {
    const res = await fetch(`${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<PredictionResult>(res);
  },

  async getDatasetEvaluation(datasetId: string): Promise<PredictionResult> {
    const res = await fetch(`${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/evaluation`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PredictionResult>(res);
  },

  getDownloadProcessedUrl(datasetId: string): string {
    const token = tokenStorage.get();
    const base = `${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/download/processed`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },

  getDownloadEvaluationUrl(datasetId: string): string {
    const token = tokenStorage.get();
    const base = `${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/download/evaluation`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },

  getDownloadPredictionUrl(datasetId: string): string {
    const token = tokenStorage.get();
    const base = `${API_BASE_URL}/api/dataset/${encodeURIComponent(datasetId)}/download/prediction`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },
};
