import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/Badge';
import type { Student } from '../../../types/teacher';

const HIGHLIGHT_ROW: Record<Student['status'], string> = {
  NORMAL: '',
  WARNING: 'bg-amber-50',
  UNSUBMITTED: 'bg-slate-50',
};

export function StudentTable({ students }: { students: Student[] }) {
  const navigate = useNavigate();

  if (students.length === 0) {
    return <p className="p-6 text-sm text-gray-500">担当生徒が登録されていません。</p>;
  }

  return (
    <table className="teacher-student-table w-full border-collapse text-sm">
      <caption className="sr-only">担当生徒の学習状況。氏名のリンクから詳細を開けます。</caption>
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th scope="col" className="px-4 py-2 font-medium">氏名</th>
          <th scope="col" className="px-4 py-2 font-medium">直近の理解度</th>
          <th scope="col" className="px-4 py-2 font-medium">最終学習日</th>
          <th scope="col" className="px-4 py-2 font-medium">状況</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr
            key={student.id}
            onClick={() =>
              navigate(`/teacher/students/${student.id}/progress`, {
                state: { name: student.name },
              })
            }
            className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${HIGHLIGHT_ROW[student.status]}`}
          >
            <td className="px-4 py-3 font-medium text-gray-900">
              <Link
                to={`/teacher/students/${student.id}/progress`}
                state={{ name: student.name }}
                onClick={event => event.stopPropagation()}
                className="inline-flex min-h-10 items-center text-blue-700 underline underline-offset-4"
              >{student.name}</Link>
            </td>
            <td className="px-4 py-3">
              <span>{student.understanding === null ? '未確認' : `${student.understanding}/5`}</span>
            </td>
            <td className="px-4 py-3 text-gray-600">{student.lastLogin}</td>
            <td className="px-4 py-3">
              <StatusBadge status={student.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
