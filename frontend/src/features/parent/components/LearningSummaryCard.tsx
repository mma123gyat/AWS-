export function LearningSummaryCard({ weeklyStudyMinutes, studiedDays, recordCount }: {
  weeklyStudyMinutes: number;
  studiedDays: number;
  recordCount: number;
}) {
  return <section className="parent-card parent-summary" aria-labelledby="parent-summary-title">
    <div className="parent-section-heading"><div><p className="parent-section-label">学習のまとめ</p><h2 id="parent-summary-title">直近7日間の学習</h2></div><span className="parent-period">日本時間・今日を含む</span></div>
    <dl className="parent-summary-grid">
      <div><dt>記録された学習時間</dt><dd>{weeklyStudyMinutes}<span>分</span></dd></div>
      <div><dt>学習した日</dt><dd>{studiedDays}<span>日</span></dd></div>
      <div><dt>学習記録</dt><dd>{recordCount}<span>件</span></dd></div>
    </dl>
    {recordCount === 0 && <p className="parent-empty-note" role="status">この期間の学習記録はまだありません。記録が届いたら、ここに表示されます。</p>}
    <p className="parent-footnote">最新50件の記録をもとに、今日を含む直近7日間を集計しています。未記録の学習や出欠は含みません。</p>
  </section>;
}
