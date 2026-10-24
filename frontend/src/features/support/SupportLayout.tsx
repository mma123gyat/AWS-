import { signOut } from 'aws-amplify/auth';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/support/report', label: 'レポート出力' },
  { to: '/support/sharing', label: '共有設定' },
];

export function SupportLayout({ onLogout }: { onLogout: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await signOut();
      onLogout();
    } catch {
      setError('ログアウトできませんでした。もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="workspace-shell">
      <nav className="workspace-sidebar print:hidden" aria-label="支援者メニュー">
        <p className="workspace-sidebar-title">医療・連携用レポート</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `workspace-nav-link${isActive ? ' is-active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
        <button
          className="logout-button self-start"
          disabled={busy}
          onClick={handleLogout}
        >
          {busy ? 'ログアウト中…' : 'ログアウト'}
        </button>
        {error && (
          <p className="px-3 text-xs text-red-700" role="alert">
            {error}
          </p>
        )}
      </nav>
      <main className="workspace-main workspace-content">
        <Outlet />
      </main>
    </div>
  );
}
