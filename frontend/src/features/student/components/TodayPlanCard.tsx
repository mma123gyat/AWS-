import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import { generateTodayStudyPlan } from '../../../api/studentApi'
import type { DailyCondition } from '../../../api'
import type { StudyPlanWithTasks } from '../../../types/student'
import { StudyTaskCard } from './StudyTaskCard'

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
  const generating = useRef(false)

  async function handleGenerate() {
    if (generating.current) return

    generating.current = true
    setIsGenerating(true)
    setError('')

    try {
      await generateTodayStudyPlan()
      onPlanGenerated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '学習プランを作成できませんでした。')
    } finally {
      generating.current = false
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
        <p className="mt-2 text-sm text-gray-500">これまで保存した学習記録は残ります。</p>
        <Link to="/condition" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          学習時間を変更する
        </Link>
      </div>
    )
  }

  if (todayPlan === null || todayPlan.available_minutes !== todayCondition.available_minutes) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">今日使える時間：{todayCondition.available_minutes}分</p>
        <p className="mt-2 text-sm text-gray-500">選んだ時間に合う学習プランを表示しましょう。</p>
        <p className="mt-2 text-sm text-gray-500">
          この時間のプランが作成済みなら、完了状態を引き継いで表示します。
          時間を変更しても、保存済みの学習記録は残ります。
        </p>
        <button
          className="mt-4 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          disabled={isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? 'プランを準備中…' : 'この時間の学習プランを表示する'}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    )
  }

  const sortedTasks = [...todayPlan.tasks].sort((a, b) => a.task_order - b.task_order)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">今回のプラン：{todayPlan.available_minutes}分</p>
      <p className="text-lg font-semibold text-gray-900">{todayPlan.title}</p>
      <p className="mt-2 text-sm text-gray-500">{todayPlan.reason}</p>
      <ul className="mt-4 space-y-3">
        {sortedTasks.map((task) => (
          <StudyTaskCard key={task.task_id} task={task} />
        ))}
      </ul>
    </div>
  )
}
