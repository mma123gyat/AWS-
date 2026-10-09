import { useState } from 'react';
import type { FormEvent } from 'react';
import { sendSupportMessage } from '../../../api/supportApi';

export function MessageForm() {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');
    setSent(false);

    try {
      await sendSupportMessage({ body });
      setBody('');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信できませんでした。もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 print:hidden">
      <h2 className="text-sm font-medium text-gray-700">保護者へのメッセージ</h2>
      <textarea
        className="mt-3 w-full rounded-md border border-gray-300 p-3 text-sm"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="学習状況について保護者の方へお伝えしたいことを入力してください。"
        disabled={busy}
        required
      />
      <button
        type="submit"
        className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={busy}
      >
        {busy ? '送信中…' : '送信する'}
      </button>
      {sent && (
        <p className="mt-2 text-sm text-green-700" role="status">
          送信しました。
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
