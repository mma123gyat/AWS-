import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { saveCondition } from './api'
import type { AvailableMinutes, DailyCondition } from './api'
import { useNavigate } from 'react-router-dom'
import { getStudentDashboard } from './api/studentApi'
import { useFetch } from './hooks/useFetch'
import type { StudentDashboard } from './types/student'
import { subjectName } from './features/student/utils/subjectSelection'

const choices: { minutes: AvailableMinutes; label: string }[] = [
  { minutes: 0, label: '今日は休む' },
  { minutes: 5, label: '5分' },
  { minutes: 15, label: '15分' },
  { minutes: 30, label: '30分' },
]

export default function StudyTimeForm() {
  const { state, refetch } = useFetch(getStudentDashboard)
  if (state.status === 'loading') return <p role="status">学習の設定を読み込み中…</p>
  if (state.status === 'error') return <><p className="error" role="alert">{state.message}</p><button type="button" onClick={refetch}>再読み込み</button></>
  return <TimeChoiceForm key={state.data.todayCondition?.condition_id ?? 'new'} dashboard={state.data} />
}

function TimeChoiceForm({ dashboard }: { dashboard: StudentDashboard }) {
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState<AvailableMinutes>(dashboard.todayCondition?.available_minutes ?? 15)
  const subjects = dashboard.availableSubjects ?? []
  const initialSubject = dashboard.todayCondition?.subject_id ?? dashboard.myCurrentPosition?.subject_id ?? ''
  const [subjectId, setSubjectId] = useState(subjects.some(s => s.subject_id === initialSubject) ? initialSubject : subjects[0]?.subject_id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<DailyCondition | null>(null)
  const submitting = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (minutes > 0 && (!subjectId || !subjects.some(s => s.subject_id === subjectId))) {
      setError('先生に学習の現在地を登録してもらってから、教科を選んでください。')
      return
    }

    submitting.current = true
    setBusy(true)
    setError('')
    setSaved(null)

    try {
      const condition = await saveCondition(minutes, minutes > 0 ? subjectId : undefined)
      setSaved(condition)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'APIに接続できませんでした。通信状態を確認してください。'
          : err instanceof Error
            ? err.message
            : '登録できませんでした。もう一度お試しください。',
      )
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <form className="study-time-form" onSubmit={handleSubmit}>
      <p className="muted">
        今日、取り組めそうな時間を選んでください。
        お休みの日があっても大丈夫です。
      </p>

      {minutes > 0 && <div className="subject-choice">
        <label htmlFor="study-subject">今日学ぶ教科</label>
        <select id="study-subject" value={subjectId} disabled={busy || subjects.length === 0} onChange={event => { setSubjectId(event.target.value); setError('') }}>
          {subjects.length === 0 && <option value="">選べる教科がありません</option>}
          {subjects.map(subject => <option key={subject.subject_id} value={subject.subject_id}>{subjectName(subject.subject_id)}：{subject.unit_name}</option>)}
        </select>
        <p className="muted">先生が登録した学習の現在地から選べます。数学がない場合は、先生に数学の現在地と学校の授業進度を登録してもらってください。</p>
        {!dashboard.availableSubjects && <p className="error" role="alert">教科一覧を取得できません。教科選択に対応したAPIの更新後に再読み込みしてください。</p>}
      </div>}

      <div className="time-choices" role="group" aria-label="今日の学習時間">
        {choices.map((choice) => (
          <button
            key={choice.minutes}
            type="button"
            className={`time-choice ${
              minutes === choice.minutes ? 'selected' : ''
            }`}
            aria-pressed={minutes === choice.minutes}
            disabled={busy}
            onClick={() => {
              setMinutes(choice.minutes)
              setSaved(null)
              setError('')
            }}
          >
            <span className="time-choice-label">{choice.label}</span>
            <span className="time-choice-hint">{choice.minutes === 0 ? 'ゆっくり休もう' : choice.minutes === 5 ? '少しだけ' : choice.minutes === 15 ? '無理のないペースで' : 'じっくり取り組む'}</span>
          </button>
        ))}
      </div>

      <p className="muted">同じ日に同じ教科・時間へ戻すと、作成済みのプランと完了記録を引き継ぎます。</p>
      <button className="primary-button" type="submit" disabled={busy || (minutes > 0 && subjects.length === 0)}>
        {busy ? '登録中…' : minutes === 0 ? '今日は休む' : 'この教科・時間で登録する'}
      </button>

      {saved && (
        <p className="success" role="status">
          {saved.date}：
          {saved.available_minutes === 0
            ? '「今日は休む」で登録しました。'
            : `${saved.available_minutes}分で登録しました。`}
        </p>
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}
