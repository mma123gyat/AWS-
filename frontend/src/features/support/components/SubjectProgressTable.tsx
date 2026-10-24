import type { ApiSupportNeededSubject, ApiSupportSubjectProgress } from '../../../types/api';

function statusLabel(status: ApiSupportSubjectProgress['status']): string {
  switch (status) {
    case 'NOT_STARTED': return '未着手';
    case 'IN_PROGRESS': return '進行中';
    case 'COMPLETED': return '完了';
    default: return '—';
  }
}

export function SubjectProgressTable({
  subjects,
  supportNeeded,
}: {
  subjects: ApiSupportSubjectProgress[];
  supportNeeded: ApiSupportNeededSubject[];
}) {
  const reasonsBySubject = new Map(supportNeeded.map((s) => [s.subjectId, s.reasons]));

  return (
    <>
    <p className="text-xs text-gray-500 sm:hidden print:hidden">表は横にスクロールできます。</p>
    <div role="region" aria-label="教科別の状況" tabIndex={0} className="support-report-table-container overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="support-report-table w-full min-w-[540px] text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th scope="col" className="px-4 py-2">教科</th>
            <th scope="col" className="px-4 py-2">理解度</th>
            <th scope="col" className="px-4 py-2">進行状態</th>
            <th scope="col" className="px-4 py-2">備考</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.subjectId} className="border-t border-gray-100">
              <td className="px-4 py-2 font-medium text-gray-900">{subject.subjectName}</td>
              <td className="px-4 py-2 text-gray-600">{subject.understanding ?? '-'}</td>
              <td className="px-4 py-2 text-gray-600">{statusLabel(subject.status)}</td>
              <td className="px-4 py-2 text-gray-500">
                {(reasonsBySubject.get(subject.subjectId) ?? []).join(' / ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
