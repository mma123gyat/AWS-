import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { saveCondition } from './api'
import type { AvailableMinutes, DailyCondition } from './api'
import { useNavigate } from 'react-router-dom'

const choices: { minutes: AvailableMinutes; label: string }[] = [
  { minutes: 0, label: '今日は休む' },
  { minutes: 5, label: '5分' },
  { minutes: 15, label: '15分' },
  { minutes: 30, label: '30分' },
]

export default function StudyTimeForm() {
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState<AvailableMinutes>(15)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<DailyCondition | null>(null)
  const submitting = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return

    submitting.current = true
    setBusy(true)
    setError('')
    setSaved(null)

    try {
      const condition = await saveCondition(minutes)
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
    <form onSubmit={handleSubmit}>
      <p className="muted">
        今日、取り組めそうな時間を選んでください。
        お休みの日があっても大丈夫です。
      </p>

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
            {choice.label}
          </button>
        ))}
      </div>

      <button type="submit" disabled={busy}>
        {busy ? '登録中…' : 'この時間で登録する'}
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