import { signOut } from 'aws-amplify/auth';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PortalFrame } from '../../components/layout/PortalFrame';
import './SupportUI.css';

const NAV_ITEMS = [
  { to: '/support/report', label: 'レポート出力' },
  { to: '/support/sharing', label: '共有設定' },
];

export function SupportLayout({ email, onLogout }: { email: string; onLogout: () => void }) {
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
    <div className="support-portal">
      <PortalFrame label="支援者ポータル" email={email} links={NAV_ITEMS} busy={busy} error={error} onLogout={handleLogout}>
        <Outlet />
      </PortalFrame>
    </div>
  );
}
