import type { CurriculumStatus } from '../../../types/api';

// 「学校の進度」(status) と「個人の進度」(understanding, 1-5) は
// データ構造が異なるため、グラフ上で同じ0-100%軸に乗せるためのスコア化。
export function scoreFromCurriculumStatus(status: CurriculumStatus | undefined): number {
  switch (status) {
    case 'COMPLETED':
      return 100;
    case 'IN_PROGRESS':
      return 50;
    default:
      return 0;
  }
}

export function scoreFromUnderstanding(understanding: number | null | undefined): number {
  if (understanding == null) return 0;
  return Math.round((understanding / 5) * 100);
}
