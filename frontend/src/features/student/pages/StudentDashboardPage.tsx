import { useStudentDashboard } from '../../../hooks/useStudentDashboard'
import { LoadingState } from '../../../components/ui/LoadingState'
import { ErrorState } from '../../../components/ui/ErrorState'
import { CurrentPositionCard } from '../components/CurrentPositionCard'
import { TodayPlanCard } from '../components/TodayPlanCard'

export function StudentDashboardPage() {
  const state = useStudentDashboard()

  return (
    <div className="student-dashboard">
      <header className="page-heading">
        <div>
          <p className="eyebrow">自分のペースで、一歩ずつ</p>
          <h1>ダッシュボード</h1>
          <p className="page-description">今日も、取り組めそうなことから始めましょう。</p>
        </div>
      </header>
      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && <>
        <TodayPlanCard
          todayCondition={state.data.todayCondition}
          todayPlan={state.data.todayPlan}
          onPlanGenerated={state.refetch}
        />
        <section aria-labelledby="current-position-title">
          <h2 id="current-position-title" className="section-heading">学校とわたしの現在地</h2>
          <CurrentPositionCard
            schoolCurrentPosition={state.data.schoolCurrentPosition}
            myCurrentPosition={state.data.myCurrentPosition}
          />
        </section>
      </>}
    </div>
  )
}
