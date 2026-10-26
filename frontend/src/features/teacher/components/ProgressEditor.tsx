import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { getClassProgress, getStudentProgress, putClassProgress, putStudentProgress } from '../../../api/teacherApi';
import { currentProgress, progressSubjects, readProgressItems } from '../utils/progressEditor';
import type { ProgressKind, ProgressValue } from '../utils/progressEditor';

type State = { status: 'loading' } | { status: 'error'; message: string } | {
  status: 'ready'; saved: Record<string, ProgressValue>; drafts: Record<string, ProgressValue>; subject: string;
};

/** The keyed editor binds every pending read, draft and save to one target. */
export function ProgressEditor({ kind, targetId }: { kind: ProgressKind; targetId: string }) {
  return <Editor key={`${kind}:${targetId}`} kind={kind} targetId={targetId} />;
}

function Editor({ kind, targetId }: { kind: ProgressKind; targetId: string }) {
  const id = useId();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const [savedSubject, setSavedSubject] = useState<string | null>(null);
  const active = useRef(false);
  const submitting = useRef(false);
  const selection = useRef('japanese');
  const school = kind === 'school';
  const name = school ? '学校の授業の現在地' : '生徒の学習の現在地';

  useEffect(() => {
    let current = true;
    active.current = true;
    const request = school ? getClassProgress(targetId) : getStudentProgress(targetId);
    request.then(value => {
      const saved = readProgressItems(value, kind, targetId);
      if (current) setState({ status: 'ready', saved, drafts: {}, subject: selection.current });
    }).catch(err => {
      if (current) setState({ status: 'error', message: err instanceof Error ? err.message : '現在地を取得できませんでした。' });
    });
    return () => { current = false; active.current = false; };
  }, [kind, school, targetId, attempt]);

  function reload() {
    if (submitting.current) return;
    if (state.status === 'ready' && Object.keys(state.drafts).some(subject =>
      JSON.stringify(state.drafts[subject]) !== JSON.stringify(currentProgress(state.saved, {}, subject)))
      && !window.confirm('未保存の入力を破棄して、登録済みの現在地を読み込み直しますか？')) return;
    setState({ status: 'loading' });
    setError(''); setBlocked(false); setSavedSubject(null);
    setAttempt(value => value + 1);
  }

  function update(patch: Partial<ProgressValue>) {
    setSavedSubject(null); setError('');
    setState(previous => {
      if (previous.status !== 'ready') return previous;
      const value = currentProgress(previous.saved, previous.drafts, previous.subject);
      return { ...previous, drafts: { ...previous.drafts, [previous.subject]: { ...value, ...patch } } };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || blocked || state.status !== 'ready') return;
    const subject = state.subject;
    const value = currentProgress(state.saved, state.drafts, subject);
    submitting.current = true; setSaving(true); setError(''); setSavedSubject(null);
    let received = false;
    try {
      const common = { subjectId: subject, unitName: value.unitName, status: value.status };
      const response = school
        ? await putClassProgress(targetId, { ...common, textbookPage: value.textbookPage })
        : await putStudentProgress(targetId, { ...common, understanding: value.understanding });
      received = true;
      const saved = readProgressItems([response], kind, targetId)[subject];
      if (!saved) throw new Error('保存結果の教科を確認できませんでした。再読み込みしてください。');
      if (active.current) {
        setState(previous => previous.status === 'ready' ? {
          ...previous, saved: { ...previous.saved, [subject]: saved }, drafts: { ...previous.drafts, [subject]: saved },
        } : previous);
        setSavedSubject(subject);
      }
    } catch (err) {
      if (active.current) {
        if (received || (err instanceof ApiError && (err.statusCode === 403 || err.statusCode === 409))) setBlocked(true);
        setError(err instanceof Error ? err.message : '登録できませんでした。もう一度お試しください。');
      }
    } finally {
      submitting.current = false;
      if (active.current) setSaving(false);
    }
  }

  if (state.status === 'loading') return <p role="status">登録済みの現在地を読み込んでいます…</p>;
  if (state.status === 'error') return <div><p role="alert" className="error">{state.message}</p><button type="button" onClick={reload}>現在地を再読み込み</button></div>;
  const value = currentProgress(state.saved, state.drafts, state.subject);
  const disabled = saving || blocked;
  const options = [...progressSubjects];
  for (const subject of Object.keys(state.saved)) {
    if (!options.some(option => option.id === subject)) options.push({ id: subject, name: `登録済みの教科（${subject}）` });
  }

  return <form aria-label={`${name}の登録`} onSubmit={submit} className="space-y-3">
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="sr-only">{name}の入力</legend>
      <div><label htmlFor={`${id}-subject`} className="mb-1 block text-sm font-medium">教科</label>
        <select id={`${id}-subject`} className="w-full rounded-md border border-gray-300 px-3 py-2" value={state.subject} onChange={event => {
          const subject = event.target.value;
          selection.current = subject;
          setState(previous => previous.status === 'ready' ? { ...previous, subject } : previous);
          setError('');
        }}>{options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>
      <p className="text-xs text-gray-500">{Object.hasOwn(state.saved, state.subject) ? '登録済みの設定があります。編集して保存できます。' : 'この教科の現在地は未登録です。新しく登録できます。'} 教科を切り替えても、未保存の入力はこの画面を開いている間保持されます。</p>
      <div><label htmlFor={`${id}-unit`} className="mb-1 block text-sm font-medium">単元名</label>
        <input id={`${id}-unit`} aria-describedby={`${id}-unit-hint`} required value={value.unitName} onChange={event => update({ unitName: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <p id={`${id}-unit-hint`} className="text-xs text-gray-500">単元名は200文字以内で入力してください。</p></div>
      <div><label htmlFor={`${id}-status`} className="mb-1 block text-sm font-medium">進行状態</label>
        <select id={`${id}-status`} className="w-full rounded-md border border-gray-300 px-3 py-2" value={value.status} onChange={event => update({ status: event.target.value as ProgressValue['status'] })}>
          <option value="NOT_STARTED">未着手</option><option value="IN_PROGRESS">進行中</option><option value="COMPLETED">完了</option>
        </select></div>
      {school ? <div><label htmlFor={`${id}-page`} className="mb-1 block text-sm font-medium">教科書ページ</label>
        <input id={`${id}-page`} aria-describedby={`${id}-page-hint`} value={value.textbookPage} onChange={event => update({ textbookPage: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2" />
        <p id={`${id}-page-hint`} className="text-xs text-gray-500">任意・100文字以内で入力してください。</p></div>
        : <div><label htmlFor={`${id}-understanding`} className="mb-1 block text-sm font-medium">理解度</label>
          <select id={`${id}-understanding`} className="w-full rounded-md border border-gray-300 px-3 py-2" value={value.understanding} onChange={event => update({ understanding: Number(event.target.value) })}>
            {[1, 2, 3, 4, 5].map(number => <option key={number} value={number}>{number}</option>)}
          </select></div>}
      <button type="submit" disabled={disabled} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? '登録中…' : school ? '学校進度を登録' : '生徒の現在地を登録'}</button>
    </fieldset>
    {savedSubject === state.subject && <p role="status" className="text-sm text-green-700">{school ? '学校進度を登録しました。' : '生徒の現在地を登録しました。'}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {blocked && <p className="text-sm">所属や権限が変更された可能性があります。現在地を再読み込みしてください。学校の担当クラスが変わった場合は「担当クラスを再確認」を押してください。</p>}
    <button type="button" disabled={saving} onClick={reload}>現在地を再読み込み</button>
    <p className="text-xs text-gray-500">再読み込みすると、このフォームの全教科の未保存の入力を破棄します。</p>
  </form>;
}
