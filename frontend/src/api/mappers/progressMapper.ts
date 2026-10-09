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
  const schoolScoreBySubject = new Map(
    curriculums.map((c) => [c.subject_id, scoreFromCurriculumStatus(c.status)]),
  );
  const studentScoreBySubject = new Map(
    studentProgresses.map((p) => [p.subject_id, scoreFromUnderstanding(p.understanding)]),
  );

  // 学校進度(全教科)と生徒進度(記録のある教科のみ)は母集団が異なるため、
  // 直接平均を比較すると不自然な結果になる。仕様が無いため、両方に
  // データが存在する教科だけを使って比較可能な母集団に揃える(最小修正)。
  const comparableSubjectIds = [...schoolScoreBySubject.keys()].filter((id) =>
    studentScoreBySubject.has(id),
  );

  const currentSchoolScore = average(
    comparableSubjectIds.map((id) => schoolScoreBySubject.get(id)!),
  );
  const currentStudentScore = average(
    comparableSubjectIds.map((id) => studentScoreBySubject.get(id)!),
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
