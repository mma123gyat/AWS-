import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getInvitations, sendInvitation } from '../../../api/invitationApi'
import type { Invitation, InviteRole } from '../../../api/invitationApi'
import { useFetch } from '../../../hooks/useFetch'
import './TeacherInvitationsPage.css'

const ROLES = { STUDENT: '生徒', PARENT: '保護者', SUPPORT: '支援者' }
const STATUS = { PROVISIONING: '登録の処理中・再試行待ち', SENDING: '送信処理中', SENT: '招待メール送信済み', DELIVERY_UNKNOWN: '処理結果の確認が必要' }
export function TeacherInvitationsPage() {
  const { state, refetch } = useFetch(getInvitations)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('STUDENT')
  const [studentId, setStudentId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const submitting = useRef(false)

  async function submit(event?: FormEvent, resend?: Invitation) {
    event?.preventDefault()
    if (submitting.current || state.status !== 'success') return
    if (resend && !window.confirm('招待メールを再送します。以前の仮パスワードは使えなくなります。再送しますか？')) return
    submitting.current = true
    setBusy(true); setError(''); setNotice('')
    try {
      const saved = await sendInvitation({
        email: resend?.email ?? email.trim(), name: resend?.name ?? name.trim(),
        role: resend?.role ?? role, studentId: resend ? resend.studentId : role === 'STUDENT' ? null : studentId,
        classId: state.data.classId, operation: resend ? 'RESEND' : 'CREATE',
      })
      setNotice(saved.status === 'SENT' ? '招待メールを送信しました。受信した方に初回パスワード設定をお願いしてください。' : '招待は登録済みです。受信状況を確認し、必要な場合は再送してください。')
      if (!resend) { setName(''); setEmail(''); setStudentId('') }
      refetch()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '招待できませんでした。')
    } finally { submitting.current = false; setBusy(false) }
  }

  return <div className="invitation-page">
    <header className="teacher-page-heading"><p className="eyebrow">学びをつなぐ</p><h1>アカウントの招待</h1>
      <p>生徒・保護者・支援者を担当クラスに招待できます。本人が初回ログインでパスワードを設定します。</p>
      <button type="button" disabled={busy} onClick={() => {
        if ((name || email || studentId) && !window.confirm('未保存の招待内容を破棄して再読み込みしますか？')) return
        setName(''); setEmail(''); setStudentId(''); setRole('STUDENT'); setError(''); setNotice(''); refetch()
      }}>再読み込み</button>
    </header>
    {notice && <p className="success" role="status">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {state.status === 'loading' && <p role="status">招待情報を確認しています…</p>}
    {state.status === 'error' && <p role="alert" className="error">{state.message}</p>}
    {state.status === 'success' && <>
      <section className="surface-card invitation-form"><h2>新しく招待する</h2>
        <p>登録先：<strong>{state.data.className ?? state.data.classId}</strong></p>
        <form onSubmit={event => void submit(event)}>
          <label htmlFor="invite-role">招待する方</label>
          <select id="invite-role" disabled={busy} value={role} onChange={event => { setRole(event.target.value as InviteRole); setStudentId('') }}>
            {Object.entries(ROLES).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
          </select>
          <label htmlFor="invite-name">お名前</label>
          <input id="invite-name" value={name} onChange={event => setName(event.target.value)} maxLength={100} disabled={busy} required />
          <label htmlFor="invite-email">招待メールの送信先</label>
          <input id="invite-email" type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} disabled={busy} required />
          {role !== 'STUDENT' && <>
            <label htmlFor="invite-student">対象の生徒</label>
            <select id="invite-student" value={studentId} onChange={event => setStudentId(event.target.value)} disabled={busy} required>
              <option value="">生徒を選択してください</option>
              {state.data.students.map(student => <option key={student.studentId} value={student.studentId}>{student.name || '氏名未登録'}</option>)}
            </select>
            <p className="muted">選んだ生徒の共有設定が適用されます。本人・保護者と共有先を確認してください。現在は1アカウントにつき1人の生徒に紐づきます。</p>
          </>}
          <p className="muted">登録済みメールのロールや所属は変更しません。新しい生徒には、生徒一覧から学習の現在地も設定してください。</p>
          <button className="primary-button" disabled={busy} type="submit">{busy ? '処理中…' : '招待メールを送信する'}</button>
        </form>
      </section>
      <section className="surface-card invitation-list"><h2>このクラスの招待</h2>
        <p className="muted">新しい50件まで。送信済みは、本人の初回設定完了を意味しません。再送は1分以上あけてください。初回設定済みのアカウントには再送できません。</p>
        {state.data.invitations.length === 0 ? <p>まだ招待はありません。</p> : <ul>
          {state.data.invitations.map(item => <li key={item.email}>
            <div><h3>{item.name} <span>{ROLES[item.role]}</span></h3><p>{item.email}</p><p>{STATUS[item.status]}</p>
              {item.studentId && <p>対象：{state.data.students.find(student => student.studentId === item.studentId)?.name ?? '担当生徒を再確認してください'}</p>}
            </div>
            <button disabled={busy} onClick={() => void submit(undefined, item)}>招待を再送</button>
          </li>)}
        </ul>}
      </section>
    </>}
  </div>
}
