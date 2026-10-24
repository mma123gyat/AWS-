import { Link, useLocation, useParams } from 'react-router-dom';
import { putClassProgress, putStudentProgress } from '../../../api/teacherApi';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useCurrentTeacherClassId } from '../../../hooks/useCurrentTeacherClassId';
import { TeacherPageHeader } from '../components/TeacherPageHeader';
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
    <div className="teacher-page">
      <Link className="teacher-inline-link" to="/teacher/students">← 生徒一覧に戻る</Link>
      <TeacherPageHeader title={studentName ? `${studentName}さんの学習状況` : '生徒の学習状況'} description="学習記録を確認し、生徒に合った学習プランや授業の現在地を設定できます。" action={<Link className="teacher-inline-link" to="/teacher/logs">学習ログを開く →</Link>} />

      <StudentLearningHistoryPanel key={studentId} studentId={studentId} />

      <div className="teacher-registration-grid">
        <section className="teacher-panel teacher-settings-card teacher-ai-card">
          <h2>学習プランの設定</h2>
          <AiParameterSliders key={studentId} studentId={studentId} />
        </section>

        <section className="teacher-panel teacher-settings-card">
          <h2>学校の授業の現在地</h2>
          <p>担当クラスで進めている単元と教科書ページを登録します。</p>
          <SchoolProgressForm
            onSubmit={(input) =>
              putClassProgress(classId, input).then(() => undefined)
            }
          />
        </section>

        <section className="teacher-panel teacher-settings-card">
          <h2>生徒の学習の現在地</h2>
          <p>この生徒の単元と理解度を登録します。下の理解度は先生による設定です。</p>
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
