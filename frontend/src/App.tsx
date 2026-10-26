import { lazy, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { confirmSignIn, signIn, signOut } from 'aws-amplify/auth'
import './App.css'
import { PortalFrame } from './components/layout/PortalFrame'
import { AsyncScreen } from './components/ui/AsyncScreen'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuthSession } from './hooks/useAuthSession'
import type { Role, SessionStatus } from './hooks/useAuthSession'

const ClassManagementPage = lazy(() => import('./features/admin/ClassManagementPage'))
const StudyTimeForm = lazy(() => import('./StudyTimeForm'))
const TeacherLayout = lazy(() => import('./features/teacher/TeacherLayout').then(module => ({ default: module.TeacherLayout })))
const StudentListPage = lazy(() => import('./features/teacher/pages/StudentListPage').then(module => ({ default: module.StudentListPage })))
const StudentProgressPage = lazy(() => import('./features/teacher/pages/StudentProgressPage').then(module => ({ default: module.StudentProgressPage })))
const TeacherDashboardPage = lazy(() => import('./features/teacher/pages/TeacherDashboardPage').then(module => ({ default: module.TeacherDashboardPage })))
const TeacherLearningLogsPage = lazy(() => import('./features/teacher/pages/TeacherLearningLogsPage').then(module => ({ default: module.TeacherLearningLogsPage })))
const TeacherInvitationsPage = lazy(() => import('./features/teacher/pages/TeacherInvitationsPage').then(module => ({ default: module.TeacherInvitationsPage })))
const TeacherAlertsPage = lazy(() => import('./features/teacher/pages/TeacherAlertsPage').then(module => ({ default: module.TeacherAlertsPage })))
const ParentLayout = lazy(() => import('./features/parent/ParentLayout').then(module => ({ default: module.ParentLayout })))
const ParentDashboardPage = lazy(() => import('./features/parent/pages/ParentDashboardPage').then(module => ({ default: module.ParentDashboardPage })))
const SupportLayout = lazy(() => import('./features/support/SupportLayout').then(module => ({ default: module.SupportLayout })))
const SupportReportPage = lazy(() => import('./features/support/pages/SupportReportPage').then(module => ({ default: module.SupportReportPage })))
const SharingSettingsPanel = lazy(() => import('./features/sharing/SharingSettingsPanel').then(module => ({ default: module.SharingSettingsPanel })))
const SharingSettingsPage = lazy(() => import('./features/support/pages/SharingSettingsPage').then(module => ({ default: module.SharingSettingsPage })))
const StudentDashboardPage = lazy(() => import('./features/student/pages/StudentDashboardPage').then(module => ({ default: module.StudentDashboardPage })))

function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const [error, setError] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || submitting.current) return

    submitting.current = true
    setBusy(true)
    setError('')

    try {
      if (changingPassword && newPassword !== confirmation) {
        setError('新しいパスワードが一致しません。')
        return
      }
      const result = changingPassword
        ? await confirmSignIn({ challengeResponse: newPassword })
        : await signIn({ username: email.trim(), password })

      if (result.isSignedIn) {
        setPassword('')
        setNewPassword('')
        setConfirmation('')
        onSignedIn()
      } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
        && (result.nextStep.missingAttributes ?? []).length === 0) {
        setPassword('')
        setChangingPassword(true)
      } else {
        setPassword('')
        setError('追加認証が必要です。アカウントの設定を確認してください。')
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : ''

      if (changingPassword && ['NotAuthorizedException', 'SignInException'].includes(name)) {
        setChangingPassword(false)
        setNewPassword('')
        setConfirmation('')
        setError('初回設定の有効時間が切れました。招待メールの情報でログインし直してください。')
      } else if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') {
        setError('メールアドレスまたはパスワードを確認してください。')
      } else {
        setError(
          err instanceof Error
            ? `ログインできませんでした：${err.message}`
            : 'ログインできませんでした。もう一度お試しください。',
        )
      }
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">学習サポート</p>
        <h1>{changingPassword ? '初回パスワード設定' : 'ログイン'}</h1>
        <p className="muted">アカウント情報を入力してください。</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy || changingPassword}
            required
          />

          {!changingPassword && <>
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

          </>}
          {changingPassword && <>
            <p className="muted">今後のログインに使うパスワードを設定してください。小文字と数字を含む8文字以上で入力してください。</p>
            <label htmlFor="new-password">新しいパスワード</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={256} value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={busy} required />
            <label htmlFor="confirm-password">新しいパスワード（確認）</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={256} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} required />
          </>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? '処理中…' : changingPassword ? '設定してログイン' : 'ログイン'}
          </button>
        </form>
        {changingPassword && <button type="button" className="secondary" disabled={busy} onClick={() => { setChangingPassword(false); setNewPassword(''); setConfirmation(''); setPassword(''); setError('') }}>ログインに戻る</button>}

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
    <PortalFrame
      label="生徒ポータル" email={email} busy={busy} error={error} onLogout={handleLogout}
      links={[
        { to: '/dashboard', label: 'ダッシュボード' },
        { to: '/condition', label: '学習時間' },
        { to: '/sharing', label: '共有設定' },
      ]}
    >
      <Outlet />
    </PortalFrame>
  )
}

function ConditionPage() {
  return (
    <section className="condition-panel surface-card">
      <p className="eyebrow">今日のペースを決めよう</p>
      <h1>今日の学習時間</h1>
      <StudyTimeForm />
    </section>
  )
}

function RoleUnknownNotice({ onLogout }: { onLogout: () => void }) {
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
        <h1>権限を確認できませんでした</h1>
        <p className="muted">
          このアカウントには必要な権限が設定されていません。管理者にお問い合わせください。
        </p>
        <button className="logout-button" disabled={busy} onClick={handleLogout}>
          {busy ? 'ログアウト中…' : 'ログアウト'}
        </button>
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
  )
}

/** 未ログインは /login へ。SIGNED_IN だがロール不明(cognito:groups未設定)
 * は、どちらのロールガードにも入れずリダイレクトループになるのを避けるため
 * ここでエラー表示して止める(どこにもNavigateしない)。 */
function RequireAuth({
  status,
  role,
  onLogout,
}: {
  status: SessionStatus
  role: Role
  onLogout: () => void
}) {
  if (status === 'SIGNED_OUT') {
    return <Navigate to="/login" replace />
  }
  if (role === null) {
    return <RoleUnknownNotice onLogout={onLogout} />
  }
  return <Outlet />
}

function RequireRole({ role, allow, fallback }: { role: Role; allow: Role; fallback: string }) {
  if (role !== allow) {
    return <Navigate to={fallback} replace />
  }
  return <Outlet />
}

function homePathFor(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/classes'
    case 'TEACHER':
      return '/teacher/dashboard'
    case 'PARENT':
      return '/parent/dashboard'
    case 'SUPPORT':
      return '/support/report'
    default:
      return '/condition'
  }
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

  const homePath = homePathFor(session.role)

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session.status === 'SIGNED_IN' ? (
            session.role === null ? (
              <RoleUnknownNotice onLogout={session.refresh} />
            ) : (
              <Navigate to={homePath} replace />
            )
          ) : (
            <LoginPage onSignedIn={session.refresh} />
          )
        }
      />

      <Route
        element={
          <RequireAuth status={session.status} role={session.role} onLogout={session.refresh} />
        }
      >
        <Route path="/" element={<Navigate to={homePath} replace />} />

        <Route element={<RequireRole role={session.role} allow="ADMIN" fallback={homePath} />}>
          <Route path="/admin/classes" element={<AsyncScreen page><ClassManagementPage email={session.email} onLogout={session.refresh} /></AsyncScreen>} />
        </Route>
        <Route element={<RequireRole role={session.role} allow="STUDENT" fallback={homePath} />}>
          <Route element={<StudentLayout email={session.email} onLogout={session.refresh} />}>
            <Route path="/condition" element={<AsyncScreen page><ConditionPage /></AsyncScreen>} />
            <Route path="/dashboard" element={<AsyncScreen page><StudentDashboardPage /></AsyncScreen>} />
            <Route path="/sharing" element={<AsyncScreen page><SharingSettingsPanel key={session.email} role="STUDENT" /></AsyncScreen>} />
          </Route>
        </Route>

        <Route element={<RequireRole role={session.role} allow="TEACHER" fallback={homePath} />}>
          <Route path="/teacher" element={<AsyncScreen><TeacherLayout onLogout={session.refresh} /></AsyncScreen>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AsyncScreen page><TeacherDashboardPage /></AsyncScreen>} />
            <Route path="students" element={<AsyncScreen page><StudentListPage /></AsyncScreen>} />
            <Route path="students/:studentId/progress" element={<AsyncScreen page><StudentProgressPage /></AsyncScreen>} />
            <Route path="logs" element={<AsyncScreen page><TeacherLearningLogsPage /></AsyncScreen>} />
            <Route path="invitations" element={<AsyncScreen page><TeacherInvitationsPage /></AsyncScreen>} />
            <Route path="alerts" element={<AsyncScreen page><TeacherAlertsPage /></AsyncScreen>} />
          </Route>
        </Route>

        <Route element={<RequireRole role={session.role} allow="PARENT" fallback={homePath} />}>
          <Route path="/parent" element={<AsyncScreen><ParentLayout email={session.email} onLogout={session.refresh} /></AsyncScreen>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AsyncScreen page><ParentDashboardPage /></AsyncScreen>} />
            <Route path="sharing" element={<AsyncScreen page><SharingSettingsPanel key={session.email} role="PARENT" /></AsyncScreen>} />
          </Route>
        </Route>

        <Route element={<RequireRole role={session.role} allow="SUPPORT" fallback={homePath} />}>
          <Route path="/support" element={<AsyncScreen><SupportLayout email={session.email} onLogout={session.refresh} /></AsyncScreen>}>
            <Route index element={<Navigate to="report" replace />} />
            <Route path="report" element={<AsyncScreen page><SupportReportPage /></AsyncScreen>} />
            <Route path="sharing" element={<AsyncScreen page><SharingSettingsPage /></AsyncScreen>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
