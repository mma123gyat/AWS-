import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { signIn, signOut } from 'aws-amplify/auth'
import './App.css'
import StudyTimeForm from './StudyTimeForm'
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { TeacherLayout } from './features/teacher/TeacherLayout'
import { PlaceholderPage } from './features/teacher/pages/PlaceholderPage'
import { StudentListPage } from './features/teacher/pages/StudentListPage'
import { StudentProgressPage } from './features/teacher/pages/StudentProgressPage'
import { TeacherDashboardPage } from './features/teacher/pages/TeacherDashboardPage'
import { useAuthSession } from './hooks/useAuthSession'
import type { Role } from './hooks/useAuthSession'

function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">学習サポート</p>
        {children}
      </section>
    </main>
  )
}

function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
        setPassword('')
        onSignedIn()
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

  return (
    <AuthPageShell>
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

      {error && <p className="error" role="alert">{error}</p>}
    </AuthPageShell>
  )
}

function StudentShell({ loginEmail, onSignedOut }: { loginEmail: string; onSignedOut: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    if (busy) return

    setBusy(true)
    setError('')

    try {
      await signOut()
      onSignedOut()
    } catch {
      setError('ログアウトできませんでした。もう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthPageShell>
      {loginEmail && <p>{loginEmail}</p>}

      <Outlet />

      <button className="secondary" disabled={busy} onClick={handleLogout}>
        {busy ? 'ログアウト中…' : 'ログアウト'}
      </button>

      {error && <p className="error" role="alert">{error}</p>}
    </AuthPageShell>
  )
}

function ConditionPage() {
  return (
    <>
      <h1>今日の学習時間</h1>
      <StudyTimeForm />
    </>
  )
}

function StudentDashboardPage() {
  return (
    <>
      <h1>ダッシュボード</h1>
      <p className="muted">
        今日も、自分のペースで進めましょう。
      </p>
      <Link to="/condition">
        学習時間を選び直す
      </Link>
    </>
  )
}

function RoleUnknownNotice() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    if (busy) return

    setBusy(true)
    setError('')

    try {
      await signOut()
      window.location.assign('/login')
    } catch {
      setError('ログアウトできませんでした。もう一度お試しください。')
      setBusy(false)
    }
  }

  return (
    <AuthPageShell>
      <h1>権限を確認できませんでした</h1>
      <p className="muted">
        このアカウントにはTEACHER/STUDENTのいずれの権限も設定されていません。管理者にお問い合わせください。
      </p>
      <button className="secondary" disabled={busy} onClick={handleLogout}>
        {busy ? 'ログアウト中…' : 'ログアウト'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </AuthPageShell>
  )
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">ページが見つかりませんでした。</p>
    </div>
  )
}

function HomeOrNotice({ role }: { role: Role }) {
  if (role === null) {
    return <RoleUnknownNotice />
  }
  return <Navigate to={role === 'TEACHER' ? '/teacher/dashboard' : '/condition'} replace />
}

function RequireAuth({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  if (!signedIn) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RequireRole({
  role,
  allow,
  children,
}: {
  role: Role
  allow: 'TEACHER' | 'STUDENT'
  children: ReactNode
}) {
  if (role === null) {
    return <RoleUnknownNotice />
  }
  if (allow === 'TEACHER' && role !== 'TEACHER') {
    return <Navigate to="/condition" replace />
  }
  if (allow === 'STUDENT' && role === 'TEACHER') {
    return <Navigate to="/teacher/dashboard" replace />
  }
  return <>{children}</>
}

function App() {
  const { status, role, loginEmail, refresh } = useAuthSession()

  if (status === 'CHECKING') {
    return (
      <AuthPageShell>
        <p role="status">ログイン状態を確認しています…</p>
      </AuthPageShell>
    )
  }

  const signedIn = status === 'SIGNED_IN'

  return (
    <Routes>
      <Route
        path="/login"
        element={signedIn ? <HomeOrNotice role={role} /> : <LoginForm onSignedIn={refresh} />}
      />

      <Route
        path="/"
        element={signedIn ? <HomeOrNotice role={role} /> : <Navigate to="/login" replace />}
      />

      <Route element={<RequireAuth signedIn={signedIn}><Outlet /></RequireAuth>}>
        <Route
          element={
            <RequireRole role={role} allow="STUDENT">
              <StudentShell loginEmail={loginEmail} onSignedOut={refresh} />
            </RequireRole>
          }
        >
          <Route path="condition" element={<ConditionPage />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
        </Route>

        <Route
          path="teacher"
          element={
            <RequireRole role={role} allow="TEACHER">
              <TeacherLayout />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="students" element={<StudentListPage />} />
          <Route path="students/:studentId/progress" element={<StudentProgressPage />} />
          <Route path="logs" element={<PlaceholderPage title="学習ログ" />} />
          <Route path="alerts" element={<PlaceholderPage title="アラート" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
