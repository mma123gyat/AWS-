import { Link, useLocation, useParams } from 'react-router-dom';
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
  const { state: teacherClass, refresh: refreshTeacherClass } = useCurrentTeacherClassId();

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
          {teacherClass.status === 'loading' && <p role="status">担当クラスを確認しています…</p>}
          {teacherClass.status === 'error' && <ErrorState message={teacherClass.message} />}
          {teacherClass.status === 'success' && <>
            <p><strong>登録先：{teacherClass.data.className ?? '担当クラス'}</strong>（クラス全体に反映されます）</p>
            <SchoolProgressForm key={teacherClass.data.classId} classId={teacherClass.data.classId} />
          </>}
          <button type="button" disabled={teacherClass.status === 'loading'} onClick={refreshTeacherClass}>担当クラスを再確認</button>
          <p className="text-xs text-gray-500">再確認すると、学校進度の未保存の入力は破棄されます。</p>
        </section>

        <section className="teacher-panel teacher-settings-card">
          <h2>生徒の学習の現在地</h2>
          <p>この生徒の単元と理解度を登録します。下の理解度は先生による設定です。</p>
          <StudentProgressForm key={studentId} studentId={studentId} />
        </section>
      </div>
    </div>
  );
}
