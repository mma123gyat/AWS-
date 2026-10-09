import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useSupportReport } from '../../../hooks/useSupportReport';
import { LearningReportCard } from '../components/LearningReportCard';
import { MessageForm } from '../components/MessageForm';
import { SubjectProgressTable } from '../components/SubjectProgressTable';

export function SupportReportPage() {
  const state = useSupportReport();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-gray-900">医療・連携用レポート</h1>
        {state.status === 'success' && (
          <button
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            onClick={() => window.print()}
          >
            PDF出力(印刷)
          </button>
        )}
      </div>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && (
        <>
          <LearningReportCard report={state.data} />
          <SubjectProgressTable
            subjects={state.data.subjectProgresses}
            supportNeeded={state.data.supportNeededSubjects}
          />
          <MessageForm />
        </>
      )}
    </div>
  );
}
