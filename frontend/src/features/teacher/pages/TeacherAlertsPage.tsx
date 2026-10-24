import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/Badge';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useTeacherAlerts } from '../useTeacherAlerts';
import { formatLogDate, formatUnderstanding } from '../utils/learningLogs';
import { collectTeacherAlerts, recordTimestamp, RECORD_GAP_DAYS } from '../utils/teacherAlerts';
import './TeacherAlertsPage.css';

export function TeacherAlertsPage() {
  const { state, refresh } = useTeacherAlerts();
  const alerts = state.status === 'success' ? collectTeacherAlerts(state.data.students, state.data.fetchedAt) : [];
  const candidates = alerts.filter(alert => alert.status === 'WARNING').length;

  return (
    <div className="teacher-alerts space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">アラート・声かけのヒント</h1>
        <button type="button" className="teacher-alerts-button" disabled={state.status === 'loading'} onClick={refresh}>再読み込み</button>
      </div>
      <p className="text-sm text-gray-600">学習記録をもとに、教員が状況を確認するための一覧です。自動で通知やメッセージは送りません。</p>
      <details className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <summary className="cursor-pointer font-medium">表示基準と見方</summary>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>声かけ候補：直近の理解度が1〜2、または最終学習日から{RECORD_GAP_DAYS}日以上経った生徒。</li>
          <li>記録を確認：学習記録がない、または日時・理解度を確認できない生徒。</li>
          <li>日数は日本時間の日付で計算します。取得時点の内容なので、最新情報は再読み込みしてください。</li>
          <li>「今日は休む」の設定、出欠、休日の予定は判定に含みません。欠席や学習不振を示すものではありません。</li>
        </ul>
      </details>
      {state.status === 'loading' && <div role="status"><LoadingState /></div>}
      {state.status === 'error' && <ErrorState message={state.message} />}
      {state.status === 'success' && (
        <>
          <p className="text-sm text-gray-500">取得日時：{formatLogDate(new Date(state.data.fetchedAt).toISOString())}（日本時間）</p>
          <dl className="flex flex-wrap gap-6 rounded-lg border border-gray-200 bg-white p-4">
            <div><dt className="text-sm text-gray-600">声かけ候補</dt><dd className="text-xl font-semibold">{candidates}人</dd></div>
            <div><dt className="text-sm text-gray-600">記録を確認</dt><dd className="text-xl font-semibold">{alerts.length - candidates}人</dd></div>
          </dl>
          {state.data.students.length === 0 ? (
            <p role="status" className="rounded-lg border border-gray-200 bg-white p-6">担当生徒が登録されていません。</p>
          ) : alerts.length === 0 ? (
            <p role="status" className="rounded-lg border border-gray-200 bg-white p-6">現在の基準に当てはまる確認事項はありません。</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <caption className="sr-only">確認理由のある担当生徒。複数の理由があっても1人1行で表示します。</caption>
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600"><tr>
                  <th scope="col" className="px-4 py-3">生徒・状況</th>
                  <th scope="col" className="px-4 py-3">確認する理由</th>
                  <th scope="col" className="px-4 py-3">最終学習日時（日本時間）</th>
                  <th scope="col" className="px-4 py-3">直近の理解度</th>
                  <th scope="col" className="px-4 py-3">確認先</th>
                </tr></thead>
                <tbody>{alerts.map(({ student, status, reasons }) => (
                  <tr key={student.studentId} className="border-b border-gray-100 align-top last:border-0">
                    <td className="px-4 py-4"><p className="mb-2 font-semibold">{typeof student.name === 'string' && student.name.trim() ? student.name : '名前未設定'}</p><StatusBadge status={status} /></td>
                    <td className="max-w-96 px-4 py-4"><ul className="list-disc space-y-2 pl-4">{reasons.map(reason => <li key={reason.code}>{reason.message}</li>)}</ul></td>
                    <td className="whitespace-nowrap px-4 py-4">{student.lastStudyDate === null ? '記録なし' : Number.isFinite(recordTimestamp(student.lastStudyDate)) ? formatLogDate(student.lastStudyDate) : '日時不明'}</td>
                    <td className="px-4 py-4">{formatUnderstanding(student.lastUnderstanding)}</td>
                    <td className="whitespace-nowrap px-4 py-4"><Link className="text-blue-600 hover:underline" to={`/teacher/students/${encodeURIComponent(student.studentId)}/progress`} state={{ name: student.name }}>生徒の詳細</Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <Link className="inline-block text-sm text-blue-600 hover:underline" to="/teacher/logs">学習ログで記録を確認する</Link>
        </>
      )}
    </div>
  );
}
