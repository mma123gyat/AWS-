import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { sendSupportMessage } from '../../../api/supportApi';
import { ApiError } from '../../../api/client';
import { messageLength } from '../utils/supportReport';

export function MessageForm({ studentId, studentName }: { studentId: string; studentName: string }) {
  const id = useId();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const submitting = useRef(false);
  const active = useRef(true);
  const length = messageLength(body);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || needsReload) return;
    setError('');
    setSent(false);
    if (!length || length > 1000) {
      setError(!length ? 'メッセージを入力してください。' : 'メッセージは1000文字以内で入力してください。');
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await sendSupportMessage({ studentId, body: body.trim() });
      if (active.current) { setBody(''); setSent(true); }
    } catch (err) {
      if (active.current) {
        if (err instanceof ApiError && (err.statusCode === 403 || err.statusCode === 409)) {
          setNeedsReload(true);
          setError('送信先または共有設定が変更された可能性があります。画面上部の「再読み込み」で確認してください。入力内容は再読み込みで破棄されます。');
        } else {
          setError(err instanceof Error ? err.message : '送信できませんでした。もう一度お試しください。');
        }
      }
    } finally {
      submitting.current = false;
      if (active.current) setBusy(false);
    }
  }

  return <form onSubmit={handleSubmit} className="support-card support-message-form" aria-labelledby={`${id}-title`}>
    <div><p className="support-caption">見守りをつなぐ</p><h2 id={`${id}-title`}>保護者へのメッセージ</h2></div>
    <p className="support-message-recipient">対象：<strong>{studentName}</strong></p>
    <p className="support-note" id={`${id}-help`}>この生徒に紐づく保護者へ送信します。取り組めたことや、家庭での見守りのヒントを伝えましょう。</p>
    <label htmlFor={`${id}-body`}>メッセージ本文</label>
    <textarea id={`${id}-body`} aria-describedby={`${id}-help ${id}-count`} rows={5} value={body} onChange={event => { setBody(event.target.value); setError(''); setSent(false); }} placeholder="例：短い時間でも、自分のペースで取り組めています。ご家庭でも、取り組めたことを一緒に振り返ってみてください。" disabled={busy || needsReload} required />
    <div className="support-message-footer"><p id={`${id}-count`} className={length > 1000 ? 'support-invalid-count' : 'support-note'}>{length} / 1000文字</p><button type="submit" className="primary-button" disabled={busy || needsReload || !length || length > 1000}>{busy ? '送信中…' : '保護者へ送信する'}</button></div>
    {sent && <p className="success" role="status">保護者へ送信しました。</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </form>;
}
