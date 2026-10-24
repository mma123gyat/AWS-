import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/Badge';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { TeacherPageHeader } from '../components/TeacherPageHeader';
import { TeacherEmptyState } from '../components/TeacherEmptyState';
import { useTeacherAlerts } from '../useTeacherAlerts';
import { formatLogDate, formatUnderstanding } from '../utils/learningLogs';
import { collectTeacherAlerts, recordTimestamp, RECORD_GAP_DAYS } from '../utils/teacherAlerts';
import type { ApiStudentSummary } from '../../../types/api';
import './TeacherAlertsPage.css';

type Alerts = ReturnType<typeof collectTeacherAlerts>;
type Filter = 'ALL' | 'WARNING' | 'UNSUBMITTED';
function lastStudy(student: ApiStudentSummary) {
  return student.lastStudyDate === null ? '記録なし' : Number.isFinite(recordTimestamp(student.lastStudyDate)) ? formatLogDate(student.lastStudyDate) : '日時不明';
}
function DetailLink({ student }: { student: ApiStudentSummary }) {
  return <Link className="teacher-inline-link" to={`/teacher/students/${encodeURIComponent(student.studentId)}/progress`} state={{ name: student.name }}>生徒の詳細 →</Link>;
}
function AlertRecords({ alerts }: { alerts: Alerts }) {
  return <>
    <div className="teacher-alert-cards" aria-label="確認する生徒">
      {alerts.map(({ student, status, reasons }) => <article key={student.studentId} className="teacher-alert-card">
        <StatusBadge status={status} /><h3>{student.name?.trim() || '名前未設定'}さん</h3>
        <ul>{reasons.map(reason => <li key={reason.code}>{reason.message}</li>)}</ul>
        <dl><div><dt>最終学習日時（日本時間）</dt><dd>{lastStudy(student)}</dd></div><div><dt>直近の理解度</dt><dd>{formatUnderstanding(student.lastUnderstanding)}</dd></div></dl>
        <DetailLink student={student} />
      </article>)}
    </div>
    <div className="teacher-alert-table teacher-panel teacher-table-scroll" role="region" aria-label="確認する生徒" tabIndex={0}>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">確認理由のある担当生徒。複数の理由があっても1人1行で表示します。</caption>
        <thead className="border-b border-gray-200 bg-gray-50 text-gray-600"><tr>
          <th scope="col" className="px-4 py-3">生徒・状況</th><th scope="col" className="px-4 py-3">確認する理由</th><th scope="col" className="px-4 py-3">最終学習日時（日本時間）</th><th scope="col" className="px-4 py-3">直近の理解度</th><th scope="col" className="px-4 py-3">確認先</th>
        </tr></thead>
        <tbody>{alerts.map(({ student, status, reasons }) => <tr key={student.studentId} className="border-b border-gray-100 align-top last:border-0">
          <td className="px-4 py-4"><p className="mb-2 font-semibold">{student.name?.trim() || '名前未設定'}</p><StatusBadge status={status} /></td>
          <td className="max-w-96 px-4 py-4"><ul className="list-disc space-y-2 pl-4">{reasons.map(reason => <li key={reason.code}>{reason.message}</li>)}</ul></td>
          <td className="whitespace-nowrap px-4 py-4">{lastStudy(student)}</td><td className="px-4 py-4">{formatUnderstanding(student.lastUnderstanding)}</td><td className="whitespace-nowrap px-4 py-4"><DetailLink student={student} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  </>;
}

export function TeacherAlertsPage() {
  const { state, refresh } = useTeacherAlerts();
  const [filter, setFilter] = useState<Filter>('ALL');
  const alerts = state.status === 'success' ? collectTeacherAlerts(state.data.students, state.data.fetchedAt) : [];
  const candidates = alerts.filter(alert => alert.status === 'WARNING').length;
  const visible = alerts.filter(alert => filter === 'ALL' || alert.status === filter);
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'ALL', label: 'すべて', count: alerts.length },
    { value: 'WARNING', label: '声かけ候補', count: candidates },
    { value: 'UNSUBMITTED', label: '記録を確認', count: alerts.length - candidates },
  ];
  return <div className="teacher-page teacher-alerts">
    <TeacherPageHeader title="アラート・声かけのヒント" description="学習記録をもとに、教員が状況を確認するための一覧です。自動で通知やメッセージは送りません。" action={<button type="button" className="teacher-alerts-button" disabled={state.status === 'loading'} onClick={refresh}>再読み込み</button>} />
    <details className="teacher-criteria"><summary>表示基準と見方</summary><ul className="mt-3 list-disc space-y-2 pl-5">
      <li>声かけ候補：直近の理解度が1〜2、または最終学習日から{RECORD_GAP_DAYS}日以上経った生徒。</li>
      <li>記録を確認：学習記録がない、または日時・理解度を確認できない生徒。</li>
      <li>日数は日本時間の日付で計算します。取得時点の内容なので、最新情報は再読み込みしてください。</li>
      <li>「今日は休む」の設定、出欠、休日の予定は判定に含みません。欠席や学習不振を示すものではありません。</li>
    </ul></details>
    {state.status === 'loading' && <div role="status"><LoadingState /></div>}
    {state.status === 'error' && <ErrorState message={state.message} />}
    {state.status === 'success' && <>
      <p className="teacher-updated">取得日時：{formatLogDate(new Date(state.data.fetchedAt).toISOString())}（日本時間）</p>
      <div className="teacher-alert-tabs" role="group" aria-label="表示する区分">{filters.map(item => <button type="button" key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label} {item.count}人</button>)}</div>
      {state.data.students.length === 0 ? <TeacherEmptyState title="担当生徒が登録されていません。" description="担当クラスと生徒の紐づけを管理者に確認してください。" />
        : alerts.length === 0 ? <TeacherEmptyState title="現在の基準に当てはまる確認事項はありません。" description="必要に応じて、学習ログから一人ひとりの記録も確認できます。" />
        : visible.length === 0 ? <TeacherEmptyState title="この区分に該当する生徒はいません" description="別の区分を選ぶと、ほかの確認事項を表示できます。" />
        : <AlertRecords alerts={visible} />}
      <Link className="teacher-inline-link" to="/teacher/logs">学習ログで記録を確認する →</Link>
    </>}
  </div>;
}
