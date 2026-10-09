import { fetchAuthSession } from 'aws-amplify/auth';
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

const rawApiBase = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBase) {
  throw new Error('VITE_API_BASE_URL が設定されていません。');
}

const BASE_URL = rawApiBase.replace(/\/+$/, '');

async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      throw new ApiError('UNAUTHENTICATED', 'ログインし直してください。', 401);
    }
    return token;
  } catch {
    throw new ApiError('UNAUTHENTICATED', 'ログインし直してください。', 401);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: token,
    ...(options.headers as Record<string, string> | undefined),
  };

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
