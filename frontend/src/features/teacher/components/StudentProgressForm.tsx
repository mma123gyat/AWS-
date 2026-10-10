import { useState, type FormEvent } from 'react';
import type { CurriculumStatus, PutStudentProgressRequest } from '../../../types/api';

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

const UNDERSTANDING_OPTIONS = [1, 2, 3, 4, 5];

export function StudentProgressForm({
  onSubmit,
}: {
  onSubmit: (input: PutStudentProgressRequest) => Promise<void>;
}) {
  const [form, setForm] = useState<PutStudentProgressRequest>({
    subjectId: SUBJECT_OPTIONS[0].id,
    unitName: '',
    status: 'IN_PROGRESS',
    understanding: 3,
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await onSubmit(form);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="studentSubjectId" className="mb-1 block text-sm font-medium text-gray-700">
          教科
        </label>
        <select
          id="studentSubjectId"
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
        <label htmlFor="studentUnitName" className="mb-1 block text-sm font-medium text-gray-700">
          単元名
        </label>
        <input
          id="studentUnitName"
          type="text"
          required
          value={form.unitName}
          onChange={(e) => setForm((prev) => ({ ...prev, unitName: e.target.value }))}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="studentStatus" className="mb-1 block text-sm font-medium text-gray-700">
          進行状態
        </label>
        <select
          id="studentStatus"
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
        <label htmlFor="studentUnderstanding" className="mb-1 block text-sm font-medium text-gray-700">
          理解度
        </label>
        <select
          id="studentUnderstanding"
          value={form.understanding}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, understanding: Number(e.target.value) }))
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {UNDERSTANDING_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {status === 'submitting' ? '登録中...' : '生徒の現在地を登録'}
      </button>
      {status === 'success' && (
        <p className="text-sm text-green-700">生徒の現在地を登録しました。</p>
      )}
      {status === 'error' && <p className="text-sm text-red-700">登録に失敗しました。</p>}
    </form>
  );
}
