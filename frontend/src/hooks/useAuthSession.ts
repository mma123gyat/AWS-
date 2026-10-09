import { useCallback, useEffect, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

export type AuthStatus = 'CHECKING' | 'SIGNED_OUT' | 'SIGNED_IN'
export type Role = 'TEACHER' | 'STUDENT' | null

type AuthSessionState = {
  status: AuthStatus
  role: Role
  loginEmail: string
}

function resolveRole(groups: unknown): Role {
  if (!Array.isArray(groups)) return null
  if (groups.includes('TEACHER')) return 'TEACHER'
  if (groups.includes('STUDENT')) return 'STUDENT'
  return null
}

const INITIAL_STATE: AuthSessionState = { status: 'CHECKING', role: null, loginEmail: '' }

/**
 * Cognitoの現在の有効なセッションを常に正とする認証状態。
 * ロールはlocalStorage等に保存せず、都度 fetchAuthSession() の
 * ID Token から cognito:groups を読み直す。
 */
export function useAuthSession() {
  const [state, setState] = useState<AuthSessionState>(INITIAL_STATE)

  const refresh = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken

      if (!idToken) {
        setState({ status: 'SIGNED_OUT', role: null, loginEmail: '' })
        return
      }

      const payload = idToken.payload
      const email = typeof payload.email === 'string' ? payload.email : ''
      setState({
        status: 'SIGNED_IN',
        role: resolveRole(payload['cognito:groups']),
        loginEmail: email,
      })
    } catch {
      setState({ status: 'SIGNED_OUT', role: null, loginEmail: '' })
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
