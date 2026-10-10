import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { LoadingState } from '../../../components/ui/LoadingState'
import { ErrorState } from '../../../components/ui/ErrorState'
import { CurrentPositionCard } from '../components/CurrentPositionCard'
import { TodayPlanCard } from '../components/TodayPlanCard'

export function StudentDashboardPage() {
  const state = useStudentDashboard()

  if (state.status === 'loading') {
    return <LoadingState />
  }

  if (state.status === 'error') {
    return <ErrorState message={state.message} />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">ダッシュボード</h1>
      <p className="text-sm text-gray-500">今日も、自分のペースで進めましょう。</p>
      <CurrentPositionCard
        schoolCurrentPosition={state.data.schoolCurrentPosition}
        myCurrentPosition={state.data.myCurrentPosition}
      />
      <TodayPlanCard
        todayCondition={state.data.todayCondition}
        todayPlan={state.data.todayPlan}
        onPlanGenerated={state.refetch}
      />
    </div>
  )
}
