import { Link } from 'react-router-dom';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useParentDashboard } from '../../../hooks/useParentDashboard';
import { BadgeList } from '../components/BadgeList';
import { LearningSummaryCard } from '../components/LearningSummaryCard';
import { MessageList } from '../components/MessageList';
import { formatParentDate } from '../utils/parentDashboard';

function SharingStopped({ kind }: { kind: '学習のまとめ' | 'メッセージ' }) {
  return <section className="parent-card parent-sharing-stopped" aria-label={`${kind}の共有状態`}>
    <span className="parent-status-pill">共有停止中</span><h2>{kind}</h2>
    <p>{kind}は共有されていません。</p><p className="parent-footnote">表示する内容は、生徒本人か保護者が共有設定から変更できます。</p>
    <Link className="parent-link" to="/parent/sharing" aria-label={`${kind}の共有設定を開く`}>共有設定を開く →</Link>
  </section>;
}

export function ParentDashboardPage() {
  const { state, refresh } = useParentDashboard();
  return <div className="parent-dashboard">
    <header className="parent-page-header"><div><p className="eyebrow">日々の学びを、あたたかく見守る</p><h1>お子さまの学習</h1><p>取り組めたことや届いたメッセージを、見守りのきっかけに。</p></div><button type="button" onClick={refresh} disabled={state.status === 'loading'}>再読み込み</button></header>
    {state.status === 'loading' && <div className="parent-card" role="status"><LoadingState /></div>}
    {state.status === 'error' && <div className="parent-card"><ErrorState message={state.message} /></div>}
    {state.status === 'success' && <>
      <section className="parent-student-header" aria-label="見守っている生徒">
        <div><p>見守っている生徒</p><h2>{state.data.studentName?.trim() ? `${state.data.studentName.trim()}さん` : 'お子さま'}</h2><p className="parent-updated">取得日時：{formatParentDate(state.fetchedAt)}（日本時間）</p></div>
        <Link className="parent-link" to="/parent/sharing">共有する内容を確認する →</Link>
      </section>
      {state.data.weeklyStudyMinutes !== null && state.data.studiedDays !== null && state.data.recordCount !== null ? <LearningSummaryCard weeklyStudyMinutes={state.data.weeklyStudyMinutes} studiedDays={state.data.studiedDays} recordCount={state.data.recordCount} /> : <SharingStopped kind="学習のまとめ" />}
      <div className="parent-lower-grid">
        <div className="parent-main-column">{state.data.messages !== null ? <MessageList messages={state.data.messages} /> : <SharingStopped kind="メッセージ" />}</div>
        <div className="parent-side-column">
          {state.data.badges !== null && <BadgeList badges={state.data.badges} />}
          <section className="parent-card parent-sharing-summary" aria-labelledby="parent-sharing-title"><h2 id="parent-sharing-title">共有の状態</h2>
            <dl><div><dt>学習のまとめ</dt><dd>{state.data.weeklyStudyMinutes === null ? '共有停止中' : '共有中'}</dd></div><div><dt>メッセージ</dt><dd>{state.data.messages === null ? '共有停止中' : '共有中'}</dd></div></dl>
            <p className="parent-footnote">紐づいている生徒の共有設定に従って表示しています。設定は生徒本人と保護者が変更できます。</p><Link className="parent-link" to="/parent/sharing">共有設定を確認する →</Link>
          </section>
        </div>
      </div>
    </>}
  </div>;
}
