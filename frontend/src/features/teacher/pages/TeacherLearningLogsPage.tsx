import { TeacherPageHeader } from '../components/TeacherPageHeader';
import { Link } from 'react-router-dom';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import type { StudyRecord } from '../../../types/studyRecord';
import { useTeacherLearningLogs } from '../useTeacherLearningLogs';
import { formatLogDate, formatSubject, formatUnderstanding, totalLearningMinutes, validMinutes } from '../utils/learningLogs';
import './TeacherLearningLogsPage.css';

function LearningRecords({ records }: { records: StudyRecord[] }) {
  const total = totalLearningMinutes(records);
  return (
    <>
      <dl className="teacher-record-metrics">
        <div><dt className="text-sm text-gray-500">表示件数</dt><dd className="text-lg font-semibold">{records.length}件</dd></div>
        <div><dt className="text-sm text-gray-500">合計学習時間</dt><dd className="text-lg font-semibold">{total === null ? '—' : `${total}分`}</dd></div>
      </dl>
      {total === null && <p className="text-sm text-gray-600">学習時間を確認できない記録があるため、合計は表示していません。</p>}
      {records.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600" role="status">まだ学習記録がありません。</p>
      ) : (
        <>
        <div className="teacher-log-cards" aria-label="最近の学習記録">
          {records.map((record, index) => <article className="teacher-record-card" key={record.record_id || `${record.task_id}-${index}`}>
            <time>{formatLogDate(record.completed_at)}（日本時間）</time>
            <h3>{formatSubject(record.subject_id)} ／ {typeof record.unit_name === 'string' && record.unit_name.trim() ? record.unit_name : '単元不明'}</h3>
            <dl><div><dt>学習時間</dt><dd>{validMinutes(record.actual_minutes) ? `${record.actual_minutes}分` : '—'}</dd></div><div><dt>理解度</dt><dd>{formatUnderstanding(record.understanding)}</dd></div></dl>
          </article>)}
        </div>
        <div className="teacher-log-table teacher-panel teacher-table-scroll" role="region" aria-label="最近の学習記録" tabIndex={0}>
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <caption className="sr-only">選択した生徒の最近の学習記録。日時は日本時間です。</caption>
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3">学習日時（日本時間）</th>
                <th scope="col" className="px-4 py-3">教科</th>
                <th scope="col" className="px-4 py-3">単元</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right">学習時間</th>
                <th scope="col" className="px-4 py-3">理解度</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record.record_id || `${record.task_id}-${index}`} className="border-b border-gray-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{formatLogDate(record.completed_at)}</td>
                  <td className="px-4 py-3">{formatSubject(record.subject_id)}</td>
                  <td className="max-w-80 break-words px-4 py-3">{typeof record.unit_name === 'string' && record.unit_name.trim() ? record.unit_name : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{validMinutes(record.actual_minutes) ? `${record.actual_minutes}分` : '—'}</td>
                  <td className="px-4 py-3">{formatUnderstanding(record.understanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}

export function TeacherLearningLogsPage() {
  const { students, studentId, logs, selectStudent, refreshLogs, retryStudents } = useTeacherLearningLogs();
  const selectedStudent = students.status === 'success' ? students.data.find(student => student.studentId === studentId) : null;
  const name = logs.status === 'success' ? logs.data.name ?? selectedStudent?.name : selectedStudent?.name;

  return (
    <div className="teacher-page teacher-learning-logs">
      <TeacherPageHeader title="学習ログ" description="生徒を選び、取り組んだ内容と理解度を確認できます。最新20件までの記録を表示し、集計は表示中の記録が対象です。" />
      {students.status === 'loading' && <LoadingState />}
      {students.status === 'error' && (
        <div><ErrorState message={students.message} /><button type="button" className="learning-logs-button" onClick={retryStudents}>生徒一覧を再読み込み</button></div>
      )}
      {students.status === 'success' && (students.data.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6" role="status">担当生徒が登録されていません。</p>
      ) : (
        <>
          <div className="teacher-filter-bar">
            <div className="teacher-log-selector">
              <label htmlFor="learning-log-student" className="mb-1 block text-sm">生徒を選択</label>
              <select id="learning-log-student" className="max-w-full rounded-md border border-gray-300 bg-white px-3 py-2" value={studentId} onChange={event => selectStudent(event.target.value)}>
                <option value="">生徒を選んでください</option>
                {students.data.map(student => <option key={student.studentId} value={student.studentId}>{student.name || '名前未設定'}</option>)}
              </select>
            </div>
            <button type="button" className="learning-logs-button" disabled={!studentId || logs.status === 'loading'} onClick={refreshLogs}>再読み込み</button>
          </div>
          {!studentId ? <p className="text-gray-600">生徒を選ぶと、最近の学習記録を確認できます。</p> : (
            <section className="space-y-4" aria-label="選択した生徒の学習ログ" aria-busy={logs.status === 'loading'}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{name || '名前未設定'}さんの学習記録</h2>
                <Link className="text-sm text-blue-600 hover:underline" to={`/teacher/students/${encodeURIComponent(studentId)}/progress`}>生徒の詳細を見る</Link>
              </div>
              {logs.status === 'loading' && <LoadingState />}
              {logs.status === 'error' && (
                <div><ErrorState message={logs.message} /><button type="button" className="learning-logs-button" onClick={refreshLogs}>再試行</button></div>
              )}
              {logs.status === 'success' && <LearningRecords records={logs.data.recentRecords} />}
            </section>
          )}
        </>
      ))}
    </div>
  );
}
