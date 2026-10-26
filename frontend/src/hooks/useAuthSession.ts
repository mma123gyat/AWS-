import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPPORT' | null;
export type SessionStatus = 'CHECKING' | 'SIGNED_OUT' | 'SIGNED_IN';

export interface AuthSession {
  status: SessionStatus;
  role: Role;
  email: string;
  /** セッション・ロールを再取得する(ログイン直後やリロード時に呼ぶ)。 */
  refresh: () => Promise<void>;
}

function resolveRole(groupsClaim: unknown): Role {
  const groups = Array.isArray(groupsClaim)
    ? groupsClaim
    : typeof groupsClaim === 'string'
      ? [groupsClaim]
      : [];
  if (groups.includes('ADMIN')) return 'ADMIN';
  if (groups.includes('TEACHER')) return 'TEACHER';
  if (groups.includes('STUDENT')) return 'STUDENT';
  if (groups.includes('PARENT')) return 'PARENT';
  if (groups.includes('SUPPORT')) return 'SUPPORT';
  return null;
}

/**
 * CognitoのID Tokenから現在のセッション状態とロール(cognito:groups)を
 * 解決する。ページ読み込み・リロード時にも自動実行されるため、
 * 「ログイン済み=生徒」のような決め打ちをせず、常にクレームからロールを
 * 復元する。
 */
export function useAuthSession(): AuthSession {
  const [session, setSession] = useState<{
    status: SessionStatus; role: Role; email: string;
  }>({ status: 'CHECKING', role: null, email: '' });
  const mounted = useRef(false);
  const version = useRef(0);

  const readSession = useCallback(async (request: number) => {
    let next: { status: SessionStatus; role: Role; email: string };
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      next = idToken ? {
        status: 'SIGNED_IN',
        role: resolveRole(idToken.payload['cognito:groups']),
        email: typeof idToken.payload.email === 'string' ? idToken.payload.email : '',
      } : { status: 'SIGNED_OUT', role: null, email: '' };
    } catch {
      next = { status: 'SIGNED_OUT', role: null, email: '' };
    }
    // Ignore an older restore/refresh, including StrictMode's first setup.
    if (mounted.current && request === version.current) setSession(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++version.current;
    setSession({ status: 'CHECKING', role: null, email: '' });
    await readSession(request);
  }, [readSession]);

  useEffect(() => {
    mounted.current = true;
    void readSession(++version.current);
    return () => { mounted.current = false; version.current += 1; };
  }, [readSession]);

  return { ...session, refresh };
}
