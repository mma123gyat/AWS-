import type { Student } from '../../../types/teacher';

// バックエンドは生徒の状況(順調/要確認/未提出)を直接返さないため、
// 最終学習日・直近の理解度からフロント側で推定するヒューリスティック。
// 閾値はチームのフィードバックに応じて調整可能な定数として分離している。
const UNSUBMITTED_THRESHOLD_DAYS = 3;
const LOW_UNDERSTANDING_THRESHOLD = 2;

export function daysSince(dateIso: string): number {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  return Math.floor(diffMs / 86400000);
}

export function deriveStatus(
  lastStudyDate: string | null,
  lastUnderstanding: number | null,
): Student['status'] {
  if (!lastStudyDate) return 'UNSUBMITTED';

  const elapsed = daysSince(lastStudyDate);
  if (elapsed >= UNSUBMITTED_THRESHOLD_DAYS) return 'UNSUBMITTED';
  if (lastUnderstanding !== null && lastUnderstanding <= LOW_UNDERSTANDING_THRESHOLD) {
    return 'WARNING';
  }
  if (elapsed >= 1) return 'WARNING';
  return 'NORMAL';
}

export function formatLastLogin(lastStudyDate: string | null): string {
  if (!lastStudyDate) return '記録なし';
  const elapsed = daysSince(lastStudyDate);
  if (elapsed <= 0) return '今日';
  return `${elapsed}日前`;
}
