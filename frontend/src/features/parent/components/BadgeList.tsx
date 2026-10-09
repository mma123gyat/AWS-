import type { ApiBadge } from '../../../types/api';

export function BadgeList({ badges }: { badges: ApiBadge[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-700">がんばりスタンプ</p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              badge.earned
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
          >
            {badge.earned ? '🏅' : '🔒'} {badge.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
