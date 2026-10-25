import { ApiError } from '../../../api/client';
import { useRef, useState, type FormEvent } from 'react';
import type { CurriculumStatus } from '../../../types/api';
import type { SchoolProgressFormInput } from '../../../types/teacher';

// 科目一覧を返す公開APIが未実装のため、暫定の固定リストを使用。
// TODO: /subjects エンドポイントが実装されたら動的取得に置き換える。
const SUBJECT_OPTIONS = [
  { id: 'japanese', name: '国語' },
  { id: 'math', name: '算数・数学' },
  { id: 'science', name: '理科' },
  { id: 'social', name: '社会' },
  { id: 'english', name: '英語' },
];

const STATUS_OPTIONS: { value: CurriculumStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: '未着手' },
  { value: 'IN_PROGRESS', label: '進行中' },
  { value: 'COMPLETED', label: '完了' },
];

export function SchoolProgressForm({
  onSubmit,
}: {
  onSubmit: (input: SchoolProgressFormInput) => Promise<void>;
}) {
  const [form, setForm] = useState<SchoolProgressFormInput>({
    subjectId: SUBJECT_OPTIONS[0].id,
    unitName: '',
    status: 'IN_PROGRESS',
    textbookPage: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [needsReload, setNeedsReload] = useState(false);
  const submitting = useRef(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting.current || needsReload) return;
    submitting.current = true;
    setStatus('submitting');
    setError('');
    try {
      await onSubmit(form);
      setStatus('success');
    } catch (err) {
      if (err instanceof ApiError && (err.statusCode === 403 || err.statusCode === 409)) {
        setNeedsReload(true);
        setError('担当クラスまたは権限が変更された可能性があります。「担当クラスを再確認」で確認してください。');
      } else {
        setError(err instanceof ApiError ? err.message : '登録に失敗しました。もう一度お試しください。');
      }
      setStatus('error');
    } finally {
      submitting.current = false;
    }
  };

  return (
    <form aria-label="学校の授業の現在地の登録" onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="subjectId" className="mb-1 block text-sm font-medium text-gray-700">
          教科
        </label>
        <select
          id="subjectId"
          value={form.subjectId}
          onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {SUBJECT_OPTIONS.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="unitName" className="mb-1 block text-sm font-medium text-gray-700">
          単元名
        </label>
        <input
          id="unitName"
          aria-describedby="unitName-hint"
          type="text"
          required
          value={form.unitName}
          onChange={(e) => setForm((prev) => ({ ...prev, unitName: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <p id="unitName-hint" className="text-xs text-gray-500">単元名は200文字以内で入力してください。</p>
      </div>
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
          進行状態
        </label>
        <select
          id="status"
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: e.target.value as CurriculumStatus }))
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="textbookPage" className="mb-1 block text-sm font-medium text-gray-700">
          教科書ページ
        </label>
        <input
          id="textbookPage"
          aria-describedby="textbookPage-hint"
          type="text"
          value={form.textbookPage}
          onChange={(e) => setForm((prev) => ({ ...prev, textbookPage: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="例: p.42"
        />
        <p id="textbookPage-hint" className="text-xs text-gray-500">任意・100文字以内で入力してください。</p>
      </div>
      <button
        type="submit"
        disabled={status === 'submitting' || needsReload}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {status === 'submitting' ? '登録中...' : '学校進度を登録'}
      </button>
      {status === 'success' && (
        <p className="text-sm text-green-700">学校進度を登録しました。</p>
      )}
      {status === 'error' && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </form>
  );
}
