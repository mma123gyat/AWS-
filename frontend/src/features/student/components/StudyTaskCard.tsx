import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../api/client'
import { saveStudyRecord } from '../../../api/studentApi'
import type { StudyTask, Understanding } from '../../../types/student'
import { StatusPill } from './StatusPill'

const UNDERSTANDING_OPTIONS: { value: Understanding; label: string }[] = [
  { value: 1, label: '1：もう一度確認したい' },
  { value: 2, label: '2：少しわかった' },
  { value: 3, label: '3：だいたいわかった' },
  { value: 4, label: '4：よくわかった' },
  { value: 5, label: '5：自分でできる' },
]

export function StudyTaskCard({ task }: { task: StudyTask }) {
  const formId = useId()
  const [actualMinutes, setActualMinutes] = useState(String(task.planned_minutes))
  const [understanding, setUnderstanding] = useState<Understanding>(3)
  const [record, setRecord] = useState(task.completion_record ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || record) return

    const minutes = Number(actualMinutes)
    if (!Number.isSafeInteger(minutes) || minutes < 1) {
      setError('学習時間は1分以上の整数で入力してください。')
      return
    }

    submitting.current = true
    setBusy(true)
    setError('')

    try {
      const saved = await saveStudyRecord({
        taskId: task.task_id,
        actualMinutes: minutes,
        understanding,
      })
      setRecord(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存できませんでした。同じ内容でもう一度お試しください。')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <li className="rounded-md border border-gray-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-gray-900">{task.title}</p>
        <StatusPill status={record ? 'COMPLETED' : task.status} />
      </div>
      <p className="mt-1 text-sm text-gray-500">{task.description}</p>
      <p className="mt-1 text-xs text-gray-400">予定：{task.planned_minutes}分</p>

      {record ? (
        <p className="mt-3 text-sm text-green-700" role="status">
          {record.actual_minutes}分・理解度{record.understanding}/5で記録しました。
        </p>
      ) : (
        <form onSubmit={handleSubmit} aria-label={`${task.title}の学習記録`}>
          <p className="text-sm text-gray-600">
            {task.status === 'COMPLETED'
              ? '完了した学習の記録を登録してください。'
              : '取り組み終わったら、学習時間と理解度を記録しましょう。'}
          </p>
          <label htmlFor={`${formId}-minutes`}>実際に学習した時間（分）</label>
          <input
            id={`${formId}-minutes`}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={actualMinutes}
            onChange={(event) => setActualMinutes(event.target.value)}
            disabled={busy}
            required
          />
          <label htmlFor={`${formId}-understanding`}>理解度</label>
          <select
            id={`${formId}-understanding`}
            value={understanding}
            onChange={(event) => setUnderstanding(Number(event.target.value) as Understanding)}
            disabled={busy}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {UNDERSTANDING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="submit" disabled={busy}>
            {busy ? '保存中…' : task.status === 'COMPLETED' ? '学習記録を保存する' : '記録して完了する'}
          </button>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      )}
    </li>
  )
}
