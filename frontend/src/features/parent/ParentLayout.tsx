import { signOut } from 'aws-amplify/auth';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PortalFrame } from '../../components/layout/PortalFrame';

export function ParentLayout({ email, onLogout }: { email: string; onLogout: () => void }) {
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
    <PortalFrame
      label="保護者ポータル" email={email} busy={busy} error={error} onLogout={handleLogout}
      links={[{ to: '/parent/dashboard', label: 'ダッシュボード' }, { to: '/parent/sharing', label: '共有設定' }]}
    >
      <Outlet />
    </PortalFrame>
  );
}
