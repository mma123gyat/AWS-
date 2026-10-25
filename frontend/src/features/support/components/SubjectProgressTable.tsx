import type { ApiSupportNeededSubject, ApiSupportSubjectProgress } from '../../../types/api';
import { reasonLabel, statusLabel, understandingLabel } from '../utils/supportReport';

function Notes({ reasons, understanding }: { reasons: string[]; understanding: number | null }) {
  return reasons.length ? <ul className="support-reasons">{reasons.map((reason, index) => <li key={index}>{reasonLabel(reason, understanding)}</li>)}</ul> : <span className="support-note">確認事項はありません</span>;
}
export function SubjectProgressTable({ subjects, supportNeeded }: { subjects: ApiSupportSubjectProgress[]; supportNeeded: ApiSupportNeededSubject[] }) {
  const reasonsBySubject = new Map(supportNeeded.map(subject => [subject.subjectId, subject.reasons]));
  return <section className="support-card support-subjects" aria-labelledby="support-subjects-title">
    <div className="support-section-heading"><div><p className="support-caption">対話のきっかけに</p><h2 id="support-subjects-title">教科別の状況</h2></div><span className="support-pill">{subjects.length}教科</span></div>
    <p className="support-note">理解度は教員が登録した現在の情報を1〜5で表示しています。成績や医学的な判断を示すものではありません。</p>
    {subjects.length ? <>
      <div className="support-report-table-container" role="region" aria-label="教科別の状況一覧" tabIndex={0}>
        <table className="support-report-table"><thead><tr><th scope="col">教科</th><th scope="col">理解度</th><th scope="col">進行状態</th><th scope="col">確認のきっかけ</th></tr></thead>
          <tbody>{subjects.map(subject => <tr key={subject.subjectId}><th scope="row">{subject.subjectName}</th><td className="support-understanding">{understandingLabel(subject.understanding)}</td><td><span className="support-status">{statusLabel(subject.status)}</span></td><td><Notes reasons={reasonsBySubject.get(subject.subjectId) ?? []} understanding={subject.understanding} /></td></tr>)}</tbody>
        </table>
      </div>
      <ul className="support-subject-cards">{subjects.map(subject => <li key={subject.subjectId}><div className="support-section-heading"><h3>{subject.subjectName}</h3><span className="support-status">{statusLabel(subject.status)}</span></div><p className="support-mobile-understanding">理解度 <strong>{understandingLabel(subject.understanding)}</strong></p><p className="support-caption">確認のきっかけ</p><Notes reasons={reasonsBySubject.get(subject.subjectId) ?? []} understanding={subject.understanding} /></li>)}</ul>
    </> : <p className="support-empty">教科別の進み方は、まだ登録されていません。</p>}
    <p className="support-note support-criteria">理解度1・2の記録などを確認のきっかけにしています。学習のまとめが共有されている場合は、直近7日間に学習記録がない教科も表示します。休む日や未記録の学習もあるため、本人のペースや状況とあわせて確認してください。</p>
  </section>;
}
