import type { ApiSupportReport } from '../../../types/api';

export function LearningReportCard({ report }: { report: ApiSupportReport }) {
  return <section className="support-card" aria-labelledby="support-summary-title">
    <div className="support-section-heading"><div><p className="support-caption">学習のまとめ</p><h2 id="support-summary-title">直近7日間の学習</h2></div><span className="support-pill">日本時間・今日を含む</span></div>
    {report.recentStudyMinutes === null || report.recentRecordCount === null ? <div className="support-private"><span className="support-pill">共有停止中</span><p>学習のまとめは共有されていません。</p></div> : <>
      <dl className="support-metrics"><div><dt>記録された学習時間</dt><dd><strong>{report.recentStudyMinutes}</strong> 分</dd></div><div><dt>学習記録</dt><dd><strong>{report.recentRecordCount}</strong> 件</dd></div></dl>
      {report.recentRecordCount === 0 && <p className="support-empty">この期間に取得できた学習記録はありません。記録がないことだけで、学習していないとは判断しません。</p>}
      <p className="support-note">日本時間の今日を含む直近7日間の全記録を集計しています。未記録の学習は含みません。</p>
    </>}
    <div className="support-attendance"><span>出席情報</span><p>{report.attendanceNote}</p></div>
  </section>;
}
