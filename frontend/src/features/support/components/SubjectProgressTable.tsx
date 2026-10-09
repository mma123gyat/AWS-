import type { ApiSupportNeededSubject, ApiSupportSubjectProgress } from '../../../types/api';

export function SubjectProgressTable({
  subjects,
  supportNeeded,
}: {
  subjects: ApiSupportSubjectProgress[];
  supportNeeded: ApiSupportNeededSubject[];
}) {
  const reasonsBySubject = new Map(supportNeeded.map((s) => [s.subjectId, s.reasons]));

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            <th className="px-4 py-2">教科</th>
            <th className="px-4 py-2">理解度</th>
            <th className="px-4 py-2">進行状態</th>
            <th className="px-4 py-2">備考</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.subjectId} className="border-t border-gray-100">
              <td className="px-4 py-2 font-medium text-gray-900">{subject.subjectName}</td>
              <td className="px-4 py-2 text-gray-600">{subject.understanding ?? '-'}</td>
              <td className="px-4 py-2 text-gray-600">{subject.status ?? '-'}</td>
              <td className="px-4 py-2 text-gray-500">
                {(reasonsBySubject.get(subject.subjectId) ?? []).join(' / ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
