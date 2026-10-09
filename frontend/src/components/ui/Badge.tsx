import type { Student } from '../../types/teacher';

const STYLES: Record<Student['status'], { label: string; className: string; icon: string }> = {
  NORMAL: { label: '順調', className: 'bg-green-50 text-green-700 border-green-200', icon: '●' },
  WARNING: { label: '要確認', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: '▲' },
  UNSUBMITTED: { label: '未提出', className: 'bg-red-50 text-red-700 border-red-200', icon: '■' },
};

export function StatusBadge({ status }: { status: Student['status'] }) {
  const { label, className, icon } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
