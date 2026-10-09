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

/**
 * 現在有効なCognitoセッションからID Tokenを取得する。未ログイン・
 * セッション切れの場合は null を返す(呼び出し元はクラッシュせず、
 * Authorizationヘッダー無しでリクエストを送る=バックエンドが401を返す)。
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    // API GatewayのCognitoUserPoolsAuthorizerは「Bearer」プレフィックス無しで
    // ID Tokenそのものを期待する(frontend/src/api.tsの実装と同じ形式)。
    headers.Authorization = token;
  }

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
