import type { ApiTeacherProfile } from '../../../types/api';

export function readTeacherProfile(value: unknown): ApiTeacherProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('担当クラスの応答を確認できませんでした。再確認してください。');
  const data = value as Record<string, unknown>;
  if (typeof data.classId !== 'string' || !data.classId.trim() || data.classId !== data.classId.trim()
    || (data.className !== null && typeof data.className !== 'string')) {
    throw new Error('担当クラスの応答を確認できませんでした。再確認してください。');
  }
  return { classId: data.classId, className: typeof data.className === 'string' && data.className.trim() ? data.className.trim() : null };
}
