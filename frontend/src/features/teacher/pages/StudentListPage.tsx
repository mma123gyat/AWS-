import { useState } from 'react';
import { toStudent } from '../../../api/mappers/studentMapper';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useTeacherStudents } from '../useTeacherStudents';
import { StudentTable } from '../components/StudentTable';
import { TeacherPageHeader } from '../components/TeacherPageHeader';
import { TeacherEmptyState } from '../components/TeacherEmptyState';
import { filterStudents } from '../utils/studentFilters';
import type { Student } from '../../../types/teacher';

type StatusFilter = 'ALL' | Student['status'];
export function StudentListPage() {
  const { state, refresh } = useTeacherStudents();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const students = state.status === 'success' ? state.data.students.map(toStudent) : [];
  const visible = filterStudents(students, query, status);
  function clearFilters() { setQuery(''); setStatus('ALL'); }
  return <div className="teacher-page">
    <TeacherPageHeader title="生徒一覧" description="生徒を選ぶと、学習の記録と学習プランの設定を確認できます。" action={<button type="button" onClick={refresh} disabled={state.status === 'loading'}>再読み込み</button>} />
    {state.status === 'loading' && <div role="status"><LoadingState /></div>}
    {state.status === 'error' && <ErrorState message={state.message} />}
    {state.status === 'success' && (students.length === 0 ? <TeacherEmptyState title="担当生徒が登録されていません" description="担当クラスと生徒の紐づけを管理者に確認してください。" /> : <>
      <div className="teacher-filter-bar">
        <div className="teacher-search"><label htmlFor="student-search">生徒名で検索</label><input id="student-search" type="search" placeholder="名前を入力" value={query} onChange={event => setQuery(event.target.value)} /></div>
        <div><label htmlFor="student-status">状況で絞り込み</label><select id="student-status" value={status} onChange={event => setStatus(event.target.value as StatusFilter)}><option value="ALL">すべて</option><option value="WARNING">声かけ候補</option><option value="UNSUBMITTED">記録を確認</option><option value="NORMAL">確認事項なし</option></select></div>
        <button type="button" onClick={clearFilters}>条件をクリア</button>
      </div>
      <section className="teacher-panel" aria-labelledby="student-list-title">
        <div className="teacher-panel-heading"><div><h2 id="student-list-title">担当生徒</h2><p role="status">{students.length}人中 {visible.length}人を表示</p></div></div>
        {visible.length === 0 ? <TeacherEmptyState title="条件に合う生徒が見つかりません" description="名前や状況の条件を変えて、もう一度確認してください。" action={<button type="button" onClick={clearFilters}>条件をクリア</button>} /> : <>
          <p className="teacher-scroll-note">表は横にスクロールできます。</p>
          <div className="teacher-table-scroll" role="region" aria-label="生徒一覧" tabIndex={0}><StudentTable students={visible} /></div>
        </>}
      </section>
    </>)}
  </div>;
}
