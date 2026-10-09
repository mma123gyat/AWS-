import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import type { Student } from '../../../types/teacher';

const HIGHLIGHT_ROW: Record<Student['status'], string> = {
  NORMAL: '',
  WARNING: 'bg-amber-50',
  UNSUBMITTED: 'bg-red-50',
};

export function StudentTable({ students }: { students: Student[] }) {
  const navigate = useNavigate();

  if (students.length === 0) {
    return <p className="p-6 text-sm text-gray-500">担当生徒が登録されていません。</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th className="px-4 py-2 font-medium">氏名</th>
          <th className="px-4 py-2 font-medium">学習進度</th>
          <th className="px-4 py-2 font-medium">最終ログイン</th>
          <th className="px-4 py-2 font-medium">状況</th>
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
            <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
            <td className="px-4 py-3">
              <ProgressBar value={student.progress} />
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
