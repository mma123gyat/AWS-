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
    <div className="flex min-h-screen bg-gray-50">
      <nav className="flex h-full w-48 flex-col gap-1 border-r border-gray-200 bg-white p-4 print:hidden">
        <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-gray-400">医療・連携用レポート</p>
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
        <button
          className="mt-4 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
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
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
