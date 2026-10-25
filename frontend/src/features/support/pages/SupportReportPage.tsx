import { Link } from 'react-router-dom';
import { ErrorState } from '../../../components/ui/ErrorState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useSupportReport } from '../../../hooks/useSupportReport';
import { LearningReportCard } from '../components/LearningReportCard';
import { MessageForm } from '../components/MessageForm';
import { SubjectProgressTable } from '../components/SubjectProgressTable';
import { supportReportDates } from '../utils/supportReport';
import './SupportReportPage.css';

export function SupportReportPage() {
  const { state, refresh } = useSupportReport();
  const dates = state.status === 'success' ? supportReportDates(state.fetchedAt) : null;
  const studentName = state.status === 'success' && state.data.studentName?.trim() ? `${state.data.studentName.trim()}さん` : '対象の生徒';
  return <div className="support-report">
    <header className="support-report-header"><div><p className="eyebrow">学びの様子を、支援のきっかけに</p><h1>医療・連携用レポート</h1><p className="support-intro">共有されている学習状況を確認し、家庭や学校との連携に役立てましょう。</p></div>
      <div className="support-report-actions"><button type="button" onClick={refresh} disabled={state.status === 'loading'}>再読み込み</button><button type="button" className="support-report-print-button" disabled={state.status !== 'success'} onClick={() => window.print()}>PDF出力（印刷）</button></div>
    </header>
    {state.status === 'loading' && <div className="support-card" role="status"><LoadingState /></div>}
    {state.status === 'error' && <div className="support-card"><ErrorState message={state.message} /></div>}
    {state.status === 'success' && dates && <>
      <section className="support-student-header" aria-label="レポートの対象"><div><p>レポートの対象</p><h2>{studentName}</h2><p>取得日時：{dates.fetched}（日本時間）</p><p>学習のまとめの対象期間：{dates.period}（日本時間）</p></div><Link className="support-link support-screen-only" to="/support/sharing">共有内容を確認する →</Link></section>
      <LearningReportCard report={state.data} />
      {state.data.subjectProgresses !== null && state.data.supportNeededSubjects !== null ? <SubjectProgressTable subjects={state.data.subjectProgresses} supportNeeded={state.data.supportNeededSubjects} /> : <section className="support-card support-private" aria-label="教科別の状況の共有状態"><span className="support-pill">共有停止中</span><h2>教科別の状況</h2><p>教科別の状況は共有されていません。</p></section>}
      <p className="support-report-notice">このレポートは、取得時点で共有されている学習情報をまとめたものです。出席・欠席の判定や医学的な診断には使用しません。印刷・保存したPDFは、後から共有を停止しても取り消せません。</p>
      <div className="support-contact-grid support-screen-only">
        {state.data.canSendMessage ? <MessageForm key={state.data.studentId} studentName={studentName} /> : <section className="support-card support-private" aria-label="メッセージ送信の共有状態"><span className="support-pill">送信停止中</span><h2>保護者へのメッセージ</h2><p>共有設定により、メッセージを送信できません。</p><p className="support-note">支援者の送信と保護者の受信の両方が許可されている場合に送信できます。</p></section>}
        <aside className="support-card support-sharing-card"><p className="support-caption">共有されている範囲</p><h2>共有の状態</h2><dl><div><dt>学習のまとめ</dt><dd>{state.data.recentStudyMinutes === null ? '共有停止中' : '共有中'}</dd></div><div><dt>教科別の状況</dt><dd>{state.data.subjectProgresses === null ? '共有停止中' : '共有中'}</dd></div><div><dt>保護者へのメッセージ</dt><dd>{state.data.canSendMessage ? '送信可能' : '送信停止中'}</dd></div></dl><p className="support-note">設定は生徒本人と保護者が変更できます。支援者は確認のみできます。</p><Link className="support-link" to="/support/sharing">共有設定を確認する →</Link><p className="support-note">PDF出力はブラウザの印刷画面を開きます。保存先に「PDFに保存」を選んでください。メッセージ入力欄と操作ボタンは印刷しません。</p></aside>
      </div>
    </>}
  </div>;
}
