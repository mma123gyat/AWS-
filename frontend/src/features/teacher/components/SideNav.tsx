import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/teacher/dashboard', label: 'ダッシュボード' },
  { to: '/teacher/students', label: '生徒一覧' },
  { to: '/teacher/logs', label: '学習ログ' },
  { to: '/teacher/alerts', label: 'アラート' },
];

export function SideNav() {
  return (
    <nav className="workspace-sidebar" aria-label="教員メニュー">
      <p className="workspace-sidebar-title">教員管理</p>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `workspace-nav-link${isActive ? ' is-active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
