import type { ApiBadge } from '../../../types/api';
import { badgeCopy } from '../utils/parentDashboard';

export function BadgeList({ badges }: { badges: ApiBadge[] }) {
  return <section className="parent-card" aria-labelledby="parent-badges-title">
    <div className="parent-section-heading"><div><p className="parent-section-label">小さな積み重ね</p><h2 id="parent-badges-title">がんばりスタンプ</h2></div></div>
    {badges.length === 0 ? <p className="parent-empty-note">表示できるスタンプはまだありません。</p> : <ul className="parent-badge-grid">{badges.map(badge => {
      const copy = badgeCopy(badge);
      return <li key={badge.id} className={`parent-badge${badge.earned ? ' is-earned' : ''}`}>
        <span className="parent-badge-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" />{badge.earned ? <path d="m7.5 12 3 3 6-6" /> : <path d="M8 12h8" />}</svg></span>
        <span className="parent-badge-status">{badge.earned ? '獲得済み' : '獲得前'}</span>
        <h3>{copy.label}</h3><p>{copy.description}</p>
      </li>;
    })}</ul>}
    <p className="parent-footnote">スタンプは記録を振り返る目安です。休む日も大切にしながら、取り組めたことを見守ってください。</p>
  </section>;
}
