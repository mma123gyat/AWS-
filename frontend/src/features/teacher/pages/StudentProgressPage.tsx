import { useLocation, useParams } from 'react-router-dom';
import { putClassProgress, putStudentProgress } from '../../../api/teacherApi';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useCurrentTeacherClassId } from '../../../hooks/useCurrentTeacherClassId';
import { AiParameterSliders } from '../components/AiParameterSliders';
import { StudentLearningHistoryPanel } from '../components/StudentLearningHistoryPanel';
import { SchoolProgressForm } from '../components/SchoolProgressForm';
import { StudentProgressForm } from '../components/StudentProgressForm';

interface LocationState {
  name?: string;
}

export function StudentProgressPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const location = useLocation();
  const studentName = (location.state as LocationState | null)?.name;
  const classId = useCurrentTeacherClassId();

  if (!studentId) {
    return <ErrorState message="生徒IDが指定されていません。" />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">
        授業進度・授業調整{studentName ? `: ${studentName}` : ''}
      </h1>

      <StudentLearningHistoryPanel key={studentId} studentId={studentId} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">AI提案パラメータ調整</h2>
          <AiParameterSliders key={studentId} studentId={studentId} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">学校進度登録</h2>
          <SchoolProgressForm
            onSubmit={(input) =>
              putClassProgress(classId, input).then(() => undefined)
            }
          />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">生徒の現在地登録</h2>
          <StudentProgressForm
            onSubmit={(input) =>
              putStudentProgress(studentId, input).then(() => undefined)
            }
          />
        </section>
      </div>
    </div>
  );
}
