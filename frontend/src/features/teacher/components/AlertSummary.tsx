import { Link } from 'react-router-dom';
import type { Student } from '../../../types/teacher';

export function AlertSummary({ students }: { students: Student[] }) {
  const normal = students.filter((s) => s.status === 'NORMAL').length;
  const warning = students.filter((s) => s.status === 'WARNING').length;
  const unsubmitted = students.filter((s) => s.status === 'UNSUBMITTED').length;

  const cards = [
    { label: '確認事項なし', value: normal, className: 'border-green-200 bg-green-50 text-green-700' },
    { label: '声かけ候補', value: warning, className: 'border-amber-200 bg-amber-50 text-amber-800' },
    { label: '記録を確認', value: unsubmitted, className: 'border-slate-200 bg-slate-50 text-slate-700' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-lg border p-4 ${card.className}`}>
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}人</p>
          </div>
        ))}
      </div>
      <Link to="/teacher/alerts" className="mt-3 inline-block text-sm text-blue-600 hover:underline">確認する理由をアラート画面で見る</Link>
    </div>
  );
}
