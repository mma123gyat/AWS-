import { BrandMark } from '../../../components/layout/PortalFrame';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/teacher/dashboard', label: 'ダッシュボード' },
  { to: '/teacher/students', label: '生徒一覧' },
  { to: '/teacher/logs', label: '学習ログ' },
  { to: '/teacher/alerts', label: 'アラート' },
  { to: '/teacher/invitations', label: 'アカウント招待' },
];

export function SideNav() {
  return (
    <nav className="workspace-sidebar" aria-label="教員メニュー">
      <div className="teacher-sidebar-brand"><BrandMark /><div><p>学習サポート</p><span>教員ポータル</span></div></div>
      <p className="teacher-sidebar-section">学習を見守る</p>
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
