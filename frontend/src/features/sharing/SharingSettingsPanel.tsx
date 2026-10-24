import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { getSharing, saveSharing } from '../../api/sharingApi';
import type { SharingRole, SharingSettings, SharingSnapshot } from '../../types/sharing';
import './SharingSettingsPanel.css';

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; snapshot: SharingSnapshot };
const fields = {
  parent: [ ['studySummary', '学習のまとめ（直近7日間の時間・学習日数・スタンプ）'], ['messages', '支援者からのメッセージの受信・表示'] ],
  support: [ ['studySummary', '学習のまとめ（直近7日間の時間・記録件数）'], ['subjectProgress', '教科別の理解度・進み方・確認事項'], ['messages', '保護者へのメッセージ送信'] ],
} as const;

export function SharingSettingsPanel({ role }: { role: SharingRole }) {
  return <SharingEditor key={role} role={role} />;
}

function SharingEditor({ role }: { role: SharingRole }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<SharingSnapshot['settings'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const generation = useRef({ version: 0 });
  const submitting = useRef(false);

  useEffect(() => {
    const lifecycle = generation.current;
    const current = ++lifecycle.version;
    void getSharing(role).then(snapshot => {
      if (generation.current.version !== current) return;
      setState({ status: 'ready', snapshot });
      setDraft(structuredClone(snapshot.settings));
    }).catch((err: unknown) => {
      if (generation.current.version === current) setState({ status: 'error', message: err instanceof Error ? err.message : '共有設定を取得できませんでした。' });
    });
    return () => { lifecycle.version++; };
  }, [role, revision]);

  function reload() {
    if (submitting.current) return;
    setState({ status: 'loading' }); setDraft(null); setError(''); setSaved(false); setConflict(false);
    setRevision(value => value + 1);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (role === 'SUPPORT' || state.status !== 'ready' || !draft?.parent || submitting.current || conflict) return;
    submitting.current = true; setBusy(true); setError(''); setSaved(false);
    const current = generation.current.version;
    try {
      const snapshot = await saveSharing(role, { studentId: state.snapshot.studentId, settings: draft as SharingSettings, version: state.snapshot.version });
      if (generation.current.version !== current) return;
      setState({ status: 'ready', snapshot }); setDraft(structuredClone(snapshot.settings)); setSaved(true);
    } catch (err) {
      if (generation.current.version !== current) return;
      setError(err instanceof Error ? err.message : '保存できませんでした。');
      if (err instanceof ApiError && err.statusCode === 409) setConflict(true);
    } finally {
      submitting.current = false;
      if (generation.current.version === current) setBusy(false);
    }
  }

  return <section className="sharing-settings">
    <h1>共有設定</h1>
    <p>生徒本人と保護者が同じ設定を変更できます。支援者は確認のみできます。</p>
    <p>アカウントに紐づく保護者・支援者全員に適用されます。共有先の追加・変更は管理者に依頼してください。</p>
    {state.status === 'loading' && <p role="status">共有設定を読み込んでいます…</p>}
    {state.status === 'error' && <p role="alert">{state.message}</p>}
    {state.status === 'ready' && draft && <>
      <p><strong>対象：{state.snapshot.studentName ?? '生徒'}さん</strong></p>
      {state.snapshot.isLegacyDefault && <p className="sharing-note">まだ設定は保存されていません。現在はこれまでの共有状態（すべてON）を引き継いでいます。</p>}
      {state.snapshot.updatedAt && <p>最終保存：{new Date(state.snapshot.updatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}（日本時間）／{state.snapshot.updatedByRole === 'STUDENT' ? '生徒本人' : '保護者'}</p>}
      <form onSubmit={submit}>
        {(role === 'SUPPORT' ? ['support'] as const : ['parent', 'support'] as const).map(group => <fieldset key={group} disabled={role === 'SUPPORT' || busy || conflict}>
          <legend>{group === 'parent' ? '保護者に共有する内容' : '支援者に共有する内容'}</legend>
          {fields[group].map(([key, label]) => <label key={key}>
            <input type="checkbox" checked={Boolean((draft[group] as unknown as Record<string, boolean>)?.[key])}
              onChange={event => { setDraft({ ...draft, [group]: { ...draft[group], [key]: event.target.checked } }); setSaved(false); setError(''); }} />
            <span>{label}</span>
          </label>)}
        </fieldset>)}
        {!state.snapshot.canSendMessage && <p>現在、支援者から保護者へのメッセージ送信は停止しています。送信には、支援者の送信と保護者の受信の両方をONにする必要があります。</p>}
        {role !== 'SUPPORT' && <button type="submit" disabled={busy || conflict}>{busy ? '保存中…' : '共有設定を保存する'}</button>}
      </form>
      <p className="sharing-note">保存後の取得・送信に適用されます。すでに画面に表示された情報や、印刷・保存したPDFは取り消せません。学習記録や過去のメッセージは削除されず、共有を再開すると再び表示されます。教員への共有範囲は変更しません。</p>
    </>}
    {error && <p role="alert">{error}</p>}
    {saved && <p role="status">共有設定を保存しました。</p>}
    <button type="button" className="sharing-reload" disabled={busy || state.status === 'loading'} onClick={reload}>再読み込み{draft && role !== 'SUPPORT' ? '（未保存の変更を破棄）' : ''}</button>
  </section>;
}
