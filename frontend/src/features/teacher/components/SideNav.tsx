import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/teacher/dashboard', label: 'ダッシュボード' },
  { to: '/teacher/students', label: '生徒一覧' },
  { to: '/teacher/logs', label: '学習ログ' },
  { to: '/teacher/alerts', label: 'アラート' },
];

export function SideNav() {
  return (
    <nav className="flex h-full w-48 flex-col gap-1 border-r border-gray-200 bg-white p-4">
      <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-gray-400">教員管理</p>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm font-medium ${
              isActive
                ? 'border-l-2 border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
