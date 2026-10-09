import { useState } from 'react'
import type { FormEvent } from 'react'
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
import type { Role, SessionStatus } from './hooks/useAuthSession'

function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
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
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">学習サポート</p>
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
      </section>
    </main>
  )
}

function StudentLayout({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    if (busy) return

    setBusy(true)
    setError('')

    try {
      await signOut()
      onLogout()
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
        {email && <p>{email}</p>}

        <Outlet />

        <button
          className="secondary"
          disabled={busy}
          onClick={handleLogout}
        >
          {busy ? 'ログアウト中…' : 'ログアウト'}
        </button>

        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </main>
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

function DashboardPage() {
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

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">ページが見つかりませんでした。</p>
    </div>
  );
}

/** 未ログインは /login へ。SIGNED_IN だがロール不明(cognito:groups未設定)
 * は、どちらのロールガードにも入れずリダイレクトループになるのを避けるため
 * ここでエラー表示して止める。 */
function RequireAuth({ status, role }: { status: SessionStatus; role: Role }) {
  if (status === 'SIGNED_OUT') {
    return <Navigate to="/login" replace />
  }
  if (role === null) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="error" role="alert">
            このアカウントには権限(STUDENT/TEACHER)が設定されていません。管理者に連絡してください。
          </p>
        </section>
      </main>
    )
  }
  return <Outlet />
}

function RequireRole({ role, allow, fallback }: { role: Role; allow: Role; fallback: string }) {
  if (role !== allow) {
    return <Navigate to={fallback} replace />
  }
  return <Outlet />
}

function App() {
  const session = useAuthSession()

  if (session.status === 'CHECKING') {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p role="status">ログイン状態を確認しています…</p>
        </section>
      </main>
    )
  }

  const homePath = session.role === 'TEACHER' ? '/teacher/dashboard' : '/condition'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session.status === 'SIGNED_IN' ? (
            <Navigate to={homePath} replace />
          ) : (
            <LoginPage onSignedIn={session.refresh} />
          )
        }
      />

      <Route element={<RequireAuth status={session.status} role={session.role} />}>
        <Route path="/" element={<Navigate to={homePath} replace />} />

        <Route element={<RequireRole role={session.role} allow="STUDENT" fallback="/teacher/dashboard" />}>
          <Route element={<StudentLayout email={session.email} onLogout={session.refresh} />}>
            <Route path="/condition" element={<ConditionPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route element={<RequireRole role={session.role} allow="TEACHER" fallback="/condition" />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboardPage />} />
            <Route path="students" element={<StudentListPage />} />
            <Route path="students/:studentId/progress" element={<StudentProgressPage />} />
            <Route path="logs" element={<PlaceholderPage title="学習ログ" />} />
            <Route path="alerts" element={<PlaceholderPage title="アラート" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App
