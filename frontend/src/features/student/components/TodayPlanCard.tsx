import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import { generateTodayStudyPlan } from '../../../api/studentApi'
import type { DailyCondition } from '../../../api'
import type { StudyPlanWithTasks } from '../../../types/student'
import { StatusPill } from './StatusPill'

export function TodayPlanCard({
  todayCondition,
  todayPlan,
  onPlanGenerated,
}: {
  todayCondition: DailyCondition | null
  todayPlan: StudyPlanWithTasks | null
  onPlanGenerated: () => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (isGenerating) return

    setIsGenerating(true)
    setError('')

    try {
      await generateTodayStudyPlan()
      onPlanGenerated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '学習プランを作成できませんでした。')
    } finally {
      setIsGenerating(false)
    }
  }

  if (todayCondition === null) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">今日できる時間をまだ選んでいません。</p>
        <Link to="/condition" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          学習時間を選ぶ
        </Link>
      </div>
    )
  }

  if (todayCondition.available_minutes === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">今日は休む日に設定されています。</p>
        <Link to="/condition" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          学習時間を変更する
        </Link>
      </div>
    )
  }

  if (todayPlan === null) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">今日使える時間：{todayCondition.available_minutes}分</p>
        <p className="mt-2 text-sm text-gray-500">今日の学習プランはまだ作成されていません。</p>
        <button
          className="mt-4 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          disabled={isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? 'プランを作成中…' : '今日の学習プランを作る'}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    )
  }

  const sortedTasks = [...todayPlan.tasks].sort((a, b) => a.task_order - b.task_order)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-lg font-semibold text-gray-900">{todayPlan.title}</p>
      <p className="mt-2 text-sm text-gray-500">{todayPlan.reason}</p>
      <ul className="mt-4 space-y-3">
        {sortedTasks.map((task) => (
          <li key={task.task_id} className="rounded-md border border-gray-100 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-gray-900">{task.title}</p>
              <StatusPill status={task.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">{task.description}</p>
            <p className="mt-1 text-xs text-gray-400">{task.planned_minutes}分</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
