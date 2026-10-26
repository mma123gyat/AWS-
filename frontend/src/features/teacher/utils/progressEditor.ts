import type { CurriculumStatus } from '../../../types/api';

export type ProgressKind = 'school' | 'student';
export interface ProgressValue {
  subjectId: string;
  unitName: string;
  status: CurriculumStatus;
  textbookPage: string;
  understanding: number;
}
export const progressSubjects = [
  { id: 'japanese', name: '国語' }, { id: 'math', name: '算数・数学' },
  { id: 'science', name: '理科' }, { id: 'social', name: '社会' }, { id: 'english', name: '英語' },
];
export function emptyProgress(subjectId: string): ProgressValue {
  return { subjectId, unitName: '', status: 'IN_PROGRESS', textbookPage: '', understanding: 3 };
}
export function currentProgress(saved: Record<string, ProgressValue>, drafts: Record<string, ProgressValue>, subject: string): ProgressValue {
  if (Object.hasOwn(drafts, subject)) return drafts[subject];
  return Object.hasOwn(saved, subject) ? saved[subject] : emptyProgress(subject);
}
export function readProgressItems(value: unknown, kind: ProgressKind, targetId: string): Record<string, ProgressValue> {
  const invalid = () => new Error('登録済みの現在地を確認できませんでした。再読み込みしてください。');
  if (!Array.isArray(value)) throw invalid();
  const result: Record<string, ProgressValue> = Object.create(null);
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw invalid();
    const row = item as Record<string, unknown>;
    if (row[kind === 'school' ? 'class_id' : 'student_id'] !== targetId
      || typeof row.subject_id !== 'string' || !row.subject_id.trim()
      || Object.hasOwn(result, row.subject_id)
      || typeof row.unit_name !== 'string' || !row.unit_name.trim() || [...row.unit_name].length > 200
      || typeof row.status !== 'string' || !['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(row.status)) throw invalid();
    if (kind === 'school' && (typeof row.textbook_page !== 'string' || [...row.textbook_page].length > 100)) throw invalid();
    if (kind === 'student' && (typeof row.understanding !== 'number' || !Number.isInteger(row.understanding) || row.understanding < 1 || row.understanding > 5)) throw invalid();
    result[row.subject_id] = {
      subjectId: row.subject_id, unitName: row.unit_name, status: row.status as CurriculumStatus,
      textbookPage: kind === 'school' ? row.textbook_page as string : '',
      understanding: kind === 'student' ? row.understanding as number : 3,
    };
  }
  return result;
}
