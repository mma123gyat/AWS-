import { useCallback, useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export type Role = 'TEACHER' | 'STUDENT' | null;
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
  if (groups.includes('TEACHER')) return 'TEACHER';
  if (groups.includes('STUDENT')) return 'STUDENT';
  return null;
}

/**
 * CognitoのID Tokenから現在のセッション状態とロール(cognito:groups)を
 * 解決する。ページ読み込み・リロード時にも自動実行されるため、
 * 「ログイン済み=生徒」のような決め打ちをせず、常にクレームからロールを
 * 復元する。
 */
export function useAuthSession(): AuthSession {
  const [status, setStatus] = useState<SessionStatus>('CHECKING');
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState('');

  const refresh = useCallback(async () => {
    setStatus('CHECKING');
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      if (!idToken) {
        setRole(null);
        setEmail('');
        setStatus('SIGNED_OUT');
        return;
      }
      setRole(resolveRole(idToken.payload['cognito:groups']));
      setEmail(typeof idToken.payload.email === 'string' ? idToken.payload.email : '');
      setStatus('SIGNED_IN');
    } catch {
      setRole(null);
      setEmail('');
      setStatus('SIGNED_OUT');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, role, email, refresh };
}
