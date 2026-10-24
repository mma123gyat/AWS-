import type { ApiStudentSummary } from '../../../types/api';
import type { Student } from '../../../types/teacher';

export const RECORD_GAP_DAYS = 3;
const DAY_MS = 86_400_000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type AlertReasonCode = 'LOW_UNDERSTANDING' | 'RECORD_GAP' | 'NO_RECORD' | 'INVALID_RECORD';
export interface TeacherAlert {
  status: Student['status'];
  reasons: { code: AlertReasonCode; message: string }[];
}

// Require a timezone so that the same record has the same meaning on every PC.
export function recordTimestamp(value: unknown): number {
  if (typeof value !== 'string') return NaN;
  const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) return NaN;
  return Date.parse(value);
}

export function calendarDaysSince(value: unknown, now = Date.now()): number | null {
  const time = recordTimestamp(value);
  if (!Number.isFinite(time) || !Number.isFinite(now) || time > now) return null;
  return Math.floor((now + JST_OFFSET_MS) / DAY_MS) - Math.floor((time + JST_OFFSET_MS) / DAY_MS);
}

export function assessStudent(
  student: Pick<ApiStudentSummary, 'lastStudyDate' | 'lastUnderstanding'>,
  now = Date.now(),
): TeacherAlert {
  const { lastStudyDate, lastUnderstanding } = student;
  if (lastStudyDate === null) {
    return { status: 'UNSUBMITTED', reasons: [{ code: 'NO_RECORD', message: '学習記録がまだありません。利用開始状況を確認してください。' }] };
  }
  const elapsed = calendarDaysSince(lastStudyDate, now);
  if (elapsed === null) {
    return { status: 'UNSUBMITTED', reasons: [{ code: 'INVALID_RECORD', message: '最終学習日時を確認できません。記録の内容を確認してください。' }] };
  }
  const reasons: TeacherAlert['reasons'] = [];
  const validUnderstanding = typeof lastUnderstanding === 'number'
    && Number.isInteger(lastUnderstanding) && lastUnderstanding >= 1 && lastUnderstanding <= 5;
  if (validUnderstanding && lastUnderstanding <= 2) {
    reasons.push({ code: 'LOW_UNDERSTANDING', message: `直近の理解度が${lastUnderstanding}/5です。困っている内容がないか確認してください。` });
  }
  if (elapsed >= RECORD_GAP_DAYS) {
    reasons.push({ code: 'RECORD_GAP', message: `最終学習日から${elapsed}日経っています。休息や予定も含めて状況を確認してください。` });
  }
  if (!validUnderstanding) {
    reasons.push({ code: 'INVALID_RECORD', message: '直近の理解度を確認できません。学習ログを確認してください。' });
  }
  const hasCandidate = reasons.some(reason => reason.code === 'LOW_UNDERSTANDING' || reason.code === 'RECORD_GAP');
  return { status: hasCandidate ? 'WARNING' : reasons.length ? 'UNSUBMITTED' : 'NORMAL', reasons };
}

/** One row per student, even when several reasons apply. Preserve API order within each group. */
export function collectTeacherAlerts(students: ApiStudentSummary[], now = Date.now()) {
  const rank = { WARNING: 0, UNSUBMITTED: 1, NORMAL: 2 };
  return students.map(student => ({ student, ...assessStudent(student, now) }))
    .filter(alert => alert.reasons.length > 0)
    .sort((left, right) => rank[left.status] - rank[right.status]);
}
