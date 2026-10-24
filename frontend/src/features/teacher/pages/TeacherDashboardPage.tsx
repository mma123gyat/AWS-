import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useStudents } from '../../../hooks/useStudents';
import { AlertSummary } from '../components/AlertSummary';
import { StudentTable } from '../components/StudentTable';

export function TeacherDashboardPage() {
  const state = useStudents();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">教員管理ダッシュボード</h1>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && (
        <>
          <AlertSummary students={state.data} />
          <p className="text-xs text-gray-500 sm:hidden">表は横にスクロールできます。</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" role="region" aria-label="生徒一覧" tabIndex={0}>
            <StudentTable students={state.data} />
          </div>
        </>
      )}
    </div>
  );
}
