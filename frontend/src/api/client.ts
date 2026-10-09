import type { ApiEnvelope } from '../types/common';

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * 認証トークンの取得。Cognito統合担当がログインフローを実装するまでの
 * プレースホルダとして、localStorageに置かれたトークンを読む。
 */
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const body = (await response.json()) as ApiEnvelope<T>;

  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message, response.status);
  }
  return body.data;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPut<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(payload) });
}
