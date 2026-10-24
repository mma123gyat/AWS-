import { Link } from 'react-router-dom';
import type { Student } from '../../../types/teacher';

export function AlertSummary({ students }: { students: Student[] }) {
  const cards = [
    { label: '担当生徒', value: students.length, note: '担当する生徒の人数', tone: 'blue' },
    { label: '声かけ候補', value: students.filter(s => s.status === 'WARNING').length, note: '記録をもとに状況を確認', tone: 'amber' },
    { label: '記録を確認', value: students.filter(s => s.status === 'UNSUBMITTED').length, note: '記録や利用状況を確認', tone: 'slate' },
    { label: '確認事項なし', value: students.filter(s => s.status === 'NORMAL').length, note: '現在の表示基準による区分', tone: 'green' },
  ];
  return <div>
    <dl className="teacher-summary-grid">{cards.map(card => <div key={card.label} className={`teacher-metric teacher-metric-${card.tone}`}>
      <dt>{card.label}</dt><dd>{card.value}<span>人</span><small>{card.note}</small></dd>
    </div>)}</dl>
    <Link to="/teacher/alerts" className="teacher-inline-link">確認する理由をアラート画面で見る →</Link>
  </div>;
}
