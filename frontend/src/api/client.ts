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

/**
 * 現在有効なCognitoセッションからID Tokenを取得する。未ログイン・
 * セッション切れ・トークン欠落の場合はApiErrorとして即座に失敗させる。
 */
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
    // API GatewayのCognitoUserPoolsAuthorizerは「Bearer」プレフィックス無しで
    // ID Tokenそのものを期待する(frontend/src/api.tsの実装と同じ形式)。
    Authorization: token,
    ...(options.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'APIに接続できませんでした。通信状態を確認してください。', 0);
  }

  if (response.status === 401) {
    throw new ApiError('UNAUTHORIZED', 'ログインし直してください。', 401);
  }
  if (response.status === 403) {
    throw new ApiError('FORBIDDEN', 'この操作を行う権限がありません。', 403);
  }

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('INVALID_RESPONSE', 'サーバーからの応答を解析できませんでした。', response.status);
  }

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

export function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(payload) });
}
