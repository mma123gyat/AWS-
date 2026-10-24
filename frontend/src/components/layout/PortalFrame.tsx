import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type PortalLink = { to: string; label: string };

export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z" />
      <path d="M12 6v14M6 9h3M15 9h3" />
    </svg>
  </span>;
}

/** Presentation only: session handling and role guards remain in each layout. */
export function PortalFrame({ label, email, links, busy, error, onLogout, children }: {
  label: string;
  email: string;
  links: PortalLink[];
  busy: boolean;
  error: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  return <div className="portal-shell">
    <a className="skip-link" href="#portal-content">本文へ移動</a>
    <header className="portal-header">
      <div className="portal-header-inner">
        <div className="portal-brand"><BrandMark /><div><p className="portal-brand-name">学習サポート</p><p className="portal-role">{label}</p></div></div>
        <div className="portal-account">
          {email && <p className="portal-email">{email}</p>}
          <button type="button" className="logout-button" disabled={busy} onClick={onLogout}>{busy ? 'ログアウト中…' : 'ログアウト'}</button>
        </div>
      </div>
      <nav className="portal-nav" aria-label={`${label}のメニュー`}>
        {links.map(link => <NavLink key={link.to} to={link.to} className={({ isActive }) => `portal-nav-link${isActive ? ' is-active' : ''}`}>{link.label}</NavLink>)}
      </nav>
    </header>
    <main id="portal-content" className="portal-content" tabIndex={-1}>
      {children}
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  </div>;
}
