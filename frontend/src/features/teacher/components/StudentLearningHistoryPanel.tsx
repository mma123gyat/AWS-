import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useTeacherLearningHistory } from '../useTeacherLearningHistory';
import { ProgressChart } from './ProgressChart';
import './StudentLearningHistoryPanel.css';

export function StudentLearningHistoryPanel({ studentId }: { studentId: string }) {
  const { state, refresh } = useTeacherLearningHistory(studentId);
  return (
    <section className="teacher-learning-history space-y-4 rounded-lg border border-gray-200 bg-white p-4" aria-label="実際の学習記録のグラフ" aria-busy={state.status === 'loading'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">最近7日間の学習記録</h2>
        <button type="button" className="learning-history-button" onClick={refresh} disabled={state.status === 'loading'}>再読み込み</button>
      </div>
      {state.status === 'loading' && <div role="status"><LoadingState /></div>}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && <ProgressChart history={state.data} />}
    </section>
  );
}
