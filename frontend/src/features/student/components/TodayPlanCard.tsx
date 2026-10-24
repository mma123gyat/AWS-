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
      <section className="today-plan surface-card" aria-label="今日の学習プラン">
        <p className="eyebrow">今日の学習</p>
        <h2 className="today-plan-title">今日は、どのくらい取り組めそう？</h2>
        <p className="today-plan-reason">今日できる時間をまだ選んでいません。短い時間でも、自分のペースで大丈夫です。</p>
        <Link to="/condition" className="button-link primary-button today-plan-action">学習時間を選ぶ</Link>
      </section>
    )
  }

  if (todayCondition.available_minutes === 0) {
    return (
      <section className="today-plan surface-card" aria-label="今日の学習プラン">
        <div className="today-plan-toolbar"><p className="eyebrow">今日の学習</p><span className="plan-budget">お休みの日</span></div>
        <h2 className="today-plan-title">今日は休む日に設定されています。</h2>
        <p className="today-plan-reason">ゆっくり休んで、また取り組める日に。これまで保存した学習記録は残ります。</p>
        <Link to="/condition" className="text-link today-plan-action">学習時間を変更する</Link>
      </section>
    )
  }

  if (todayPlan === null || todayPlan.available_minutes !== todayCondition.available_minutes) {
    return (
      <section className="today-plan surface-card" aria-label="今日の学習プラン">
        <div className="today-plan-toolbar">
          <div className="today-plan-labels"><p className="eyebrow">今日の学習</p><span className="plan-budget">{todayCondition.available_minutes}分プラン</span></div>
          <Link to="/condition" className="text-link">学習時間を変更する</Link>
        </div>
        <h2 className="today-plan-title">今日の学習を準備しよう</h2>
        <p className="today-plan-reason">選んだ時間に合う学習プランを表示しましょう。</p>
        <p className="today-plan-reason">この時間のプランが作成済みなら、完了状態を引き継いで表示します。時間を変更しても、保存済みの学習記録は残ります。</p>
        <button className="primary-button today-plan-action" disabled={isGenerating} onClick={handleGenerate}>
          {isGenerating ? 'プランを準備中…' : 'この時間の学習プランを表示する'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    )
  }

  const sortedTasks = [...todayPlan.tasks].sort((a, b) => a.task_order - b.task_order)

  return (
    <section className="today-plan surface-card" aria-label="今日の学習プラン">
      <div className="today-plan-toolbar">
        <div className="today-plan-labels"><p className="eyebrow">今日の学習</p><span className="plan-budget">今回のプラン：{todayPlan.available_minutes}分</span></div>
        <Link to="/condition" className="text-link">学習時間を変更する</Link>
      </div>
      <h2 className="today-plan-title">{todayPlan.title}</h2>
      <p className="today-plan-reason">{todayPlan.reason}</p>
      <ul className="study-task-list">
        {sortedTasks.map((task) => <StudyTaskCard key={task.task_id} task={task} />)}
      </ul>
    </section>
  )
}
