import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useParentDashboard } from '../../../hooks/useParentDashboard';
import { BadgeList } from '../components/BadgeList';
import { LearningSummaryCard } from '../components/LearningSummaryCard';
import { MessageList } from '../components/MessageList';

export function ParentDashboardPage() {
  const state = useParentDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">保護者ポータル</h1>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && (
        <>
          <LearningSummaryCard
            studentName={state.data.studentName}
            weeklyStudyMinutes={state.data.weeklyStudyMinutes}
            studiedDays={state.data.studiedDays}
          />
          <BadgeList badges={state.data.badges} />
          <MessageList messages={state.data.messages} />
        </>
      )}
    </div>
  );
}
