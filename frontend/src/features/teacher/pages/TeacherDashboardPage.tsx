import { Link } from 'react-router-dom';
import { toStudent } from '../../../api/mappers/studentMapper';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useTeacherStudents } from '../useTeacherStudents';
import { AlertSummary } from '../components/AlertSummary';
import { StudentTable } from '../components/StudentTable';
import { TeacherPageHeader } from '../components/TeacherPageHeader';
import { TeacherEmptyState } from '../components/TeacherEmptyState';
import { formatLogDate } from '../utils/learningLogs';

export function TeacherDashboardPage() {
  const { state, refresh } = useTeacherStudents();
  const students = state.status === 'success' ? state.data.students.map(toStudent) : [];
  const preview = [...students].sort((a, b) => ({ WARNING: 0, UNSUBMITTED: 1, NORMAL: 2 }[a.status] - { WARNING: 0, UNSUBMITTED: 1, NORMAL: 2 }[b.status])).slice(0, 6);
  return <div className="teacher-page">
    <TeacherPageHeader title="ダッシュボード" description="担当生徒の学習状況を確認し、必要なサポートにつなげましょう。" action={<button type="button" onClick={refresh} disabled={state.status === 'loading'}>再読み込み</button>} />
    {state.status === 'loading' && <div role="status"><LoadingState /></div>}
    {state.status === 'error' && <ErrorState message={state.message} />}
    {state.status === 'success' && <>
      <p className="teacher-updated">取得日時：{formatLogDate(new Date(state.data.fetchedAt).toISOString())}（日本時間）</p>
      <AlertSummary students={students} />
      <div className="teacher-dashboard-grid">
        <section className="teacher-panel" aria-labelledby="dashboard-students">
          <div className="teacher-panel-heading"><div><h2 id="dashboard-students">担当生徒の状況</h2><p>声かけ候補、記録を確認、確認事項なしの順で最大6人を表示します。</p></div><Link className="teacher-inline-link" to="/teacher/students">全員を見る →</Link></div>
          {students.length === 0 ? <TeacherEmptyState title="担当生徒が登録されていません" description="担当クラスと生徒の紐づけを管理者に確認してください。" /> : <>
            <p className="teacher-scroll-note">表は横にスクロールできます。</p>
            <div className="teacher-table-scroll" role="region" aria-label="担当生徒の状況" tabIndex={0}><StudentTable students={preview} /></div>
          </>}
        </section>
        <aside className="teacher-panel teacher-quick-links" aria-labelledby="teacher-actions"><h2 id="teacher-actions">よく使う操作</h2>
          <Link to="/teacher/students"><span>生徒の詳細を確認する</span><small>理解度や学習記録、学習プランの設定</small></Link>
          <Link to="/teacher/logs"><span>学習ログを見る</span><small>生徒ごとの直近20件の学習記録</small></Link>
          <Link to="/teacher/alerts"><span>声かけのヒントを確認する</span><small>確認が必要な記録と、その理由</small></Link>
        </aside>
      </div>
    </>}
  </div>;
}
