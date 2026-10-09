import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useStudents } from '../../../hooks/useStudents';
import { StudentTable } from '../components/StudentTable';

export function StudentListPage() {
  const state = useStudents();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">生徒一覧</h1>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <StudentTable students={state.data} />
        </div>
      )}
    </div>
  );
}
