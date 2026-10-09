import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth'
import './App.css'
import StudyTimeForm from './StudyTimeForm'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { TeacherLayout } from './features/teacher/TeacherLayout'
import { PlaceholderPage } from './features/teacher/pages/PlaceholderPage'
import { StudentListPage } from './features/teacher/pages/StudentListPage'
import { StudentProgressPage } from './features/teacher/pages/StudentProgressPage'
import { TeacherDashboardPage } from './features/teacher/pages/TeacherDashboardPage'

type AuthState = 'CHECKING' | 'SIGNED_OUT' | 'SIGNED_IN'

function StudentApp() {
  const [authState, setAuthState] = useState<AuthState>('CHECKING')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const user = await getCurrentUser()
        if (active) {
          setLoginEmail(user.signInDetails?.loginId ?? '')
          setAuthState('SIGNED_IN')
        }
      } catch {
        if (active) setAuthState('SIGNED_OUT')
      }
    }

    void restoreSession()
    return () => { active = false }
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')

    try {
      const result = await signIn({
        username: email.trim(),
        password,
      })

      if (result.isSignedIn) {
        setLoginEmail(email.trim())
        setPassword('')
        setAuthState('SIGNED_IN')
      } else {
        setPassword('')
        setError('追加認証が必要です。アカウントの設定を確認してください。')
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : ''

      if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') {
        setError('メールアドレスまたはパスワードを確認してください。')
      } else {
        setError(
          err instanceof Error
            ? `ログインできませんでした：${err.message}`
            : 'ログインできませんでした。もう一度お試しください。',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    if (busy) return

    setBusy(true)
    setError('')

    try {
      await signOut()
      setLoginEmail('')
      setPassword('')
      setAuthState('SIGNED_OUT')
    } catch {
      setError('ログアウトできませんでした。もう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">学習サポート</p>

        {authState === 'CHECKING' ? (
          <p role="status">ログイン状態を確認しています…</p>
        ) : authState === 'SIGNED_IN' ? (
          <>
            {loginEmail && <p>{loginEmail}</p>}

            <Routes>
              <Route
                path="/condition"
                element={
                  <>
                    <h1>今日の学習時間</h1>
                    <StudyTimeForm />
                  </>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <>
                    <h1>ダッシュボード</h1>
                    <p className="muted">
                      今日も、自分のペースで進めましょう。
                    </p>
                    <Link to="/condition">
                      学習時間を選び直す
                    </Link>
                  </>
                }
              />

              <Route
                path="*"
                element={<Navigate to="/condition" replace />}
              />
            </Routes>
            <button
              className="secondary"
              disabled={busy}
              onClick={handleLogout}
            >
              {busy ? 'ログアウト中…' : 'ログアウト'}
            </button>
          </>
        ) : (
          <>
            <Navigate to="/login" replace />
            <h1>ログイン</h1>
            <p className="muted">アカウント情報を入力してください。</p>

            <form onSubmit={handleLogin}>
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                required
              />

              <label htmlFor="password">パスワード</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
                required
              />

              <button type="submit" disabled={busy}>
                {busy ? 'ログイン中…' : 'ログイン'}
              </button>
            </form>
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
  )
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">ページが見つかりませんでした。</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentApp />} />
      <Route path="/login" element={<StudentApp />} />
      <Route path="/condition" element={<StudentApp />} />
      <Route path="/dashboard" element={<StudentApp />} />
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboardPage />} />
        <Route path="students" element={<StudentListPage />} />
        <Route path="students/:studentId/progress" element={<StudentProgressPage />} />
        <Route path="logs" element={<PlaceholderPage title="学習ログ" />} />
        <Route path="alerts" element={<PlaceholderPage title="アラート" />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App
