import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useSupportReport } from '../../../hooks/useSupportReport';
import { LearningReportCard } from '../components/LearningReportCard';
import { MessageForm } from '../components/MessageForm';
import { SubjectProgressTable } from '../components/SubjectProgressTable';
import './SupportReportPage.css';

export function SupportReportPage() {
  const state = useSupportReport();

  return (
    <div className="support-report space-y-6">
      <div className="support-report-header">
        <h1 className="support-report-title text-xl font-semibold text-gray-900">医療・連携用レポート</h1>
        {state.status === 'success' && (
          <button
            type="button"
            className="support-report-print-button"
            onClick={() => window.print()}
          >
            PDF出力（印刷）
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
