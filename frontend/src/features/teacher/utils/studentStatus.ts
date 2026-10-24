import type { Student } from '../../../types/teacher';
import { assessStudent, calendarDaysSince } from './teacherAlerts.ts';

// Use the same criteria as the alerts page; absence of records is not a missed submission.
export function deriveStatus(
  lastStudyDate: string | null,
  lastUnderstanding: number | null,
): Student['status'] {
  return assessStudent({ lastStudyDate, lastUnderstanding }).status;
}

export function formatLastLogin(lastStudyDate: string | null): string {
  if (lastStudyDate === null) return '記録なし';
  const elapsed = calendarDaysSince(lastStudyDate);
  if (elapsed === null) return '日時不明';
  return elapsed === 0 ? '今日' : `${elapsed}日前`;
}
