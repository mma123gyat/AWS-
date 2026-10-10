import { signOut } from 'aws-amplify/auth';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './components/SideNav';

export function TeacherLayout({ onLogout }: { onLogout: () => void }) {
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
      <SideNav />
      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-gray-200 bg-white px-6 py-4">
          <button
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            disabled={busy}
            onClick={handleLogout}
          >
            {busy ? 'ログアウト中…' : 'ログアウト'}
          </button>
        </header>
        <main className="p-6">
          <Outlet />
          {error && (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
