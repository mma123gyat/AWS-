import type { Student } from '../../../types/teacher';

export function AlertSummary({ students }: { students: Student[] }) {
  const normal = students.filter((s) => s.status === 'NORMAL').length;
  const warning = students.filter((s) => s.status === 'WARNING').length;
  const unsubmitted = students.filter((s) => s.status === 'UNSUBMITTED').length;

  const cards = [
    { label: '順調', value: normal, className: 'border-green-200 bg-green-50 text-green-700' },
    { label: '要確認', value: warning, className: 'border-amber-200 bg-amber-50 text-amber-800' },
    { label: '未提出', value: unsubmitted, className: 'border-red-200 bg-red-50 text-red-700' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-lg border p-4 ${card.className}`}>
          <p className="text-sm font-medium">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold">{card.value}人</p>
        </div>
      ))}
    </div>
  );
}
