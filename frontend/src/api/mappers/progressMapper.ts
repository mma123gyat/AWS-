import {
  scoreFromCurriculumStatus,
  scoreFromUnderstanding,
} from '../../features/teacher/utils/progressScore';
import type { ApiCurriculumItem, ApiStudentProgressItem } from '../../types/api';
import type { ProgressData } from '../../types/teacher';

const MONTHS = ['4月', '5月', '6月', '7月', '8月'];

function average(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * 学校進度(Curriculums)・個人進度(StudentProgresses)はどちらも
 * 「科目ごとの最新スナップショット1件」しか保持しておらず、4〜8月の
 * 時系列履歴はバックエンドに存在しない。そのため、現在値に向けた
 * 線形補間で推移を近似表示する(=UIの注記で明示する前提の暫定仕様)。
 * 本格対応には進度の月次スナップショットをバックエンドに追加する必要がある。
 */
export function toProgressSeries(
  curriculums: ApiCurriculumItem[],
  studentProgresses: ApiStudentProgressItem[],
): ProgressData[] {
  const currentSchoolScore = average(curriculums.map((c) => scoreFromCurriculumStatus(c.status)));
  const currentStudentScore = average(
    studentProgresses.map((p) => scoreFromUnderstanding(p.understanding)),
  );

  return MONTHS.map((month, index) => {
    const factor = (index + 1) / MONTHS.length;
    return {
      month,
      schoolProgress: Math.round(currentSchoolScore * factor),
      studentProgress: Math.round(currentStudentScore * factor),
    };
  });
}
