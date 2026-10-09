import { deriveStatus, formatLastLogin } from '../../features/teacher/utils/studentStatus';
import { scoreFromUnderstanding } from '../../features/teacher/utils/progressScore';
import type { ApiStudentSummary } from '../../types/api';
import type { Student } from '../../types/teacher';

export function toStudent(api: ApiStudentSummary): Student {
  return {
    id: api.studentId,
    name: api.name ?? '(名前未設定)',
    // バックエンドに進捗率そのもののフィールドが無いため、直近の理解度(1-5)を
    // 0-100%の代理指標として近似している。本来は専用の集計値をAPIに追加すべき。
    progress: scoreFromUnderstanding(api.lastUnderstanding),
    lastLogin: formatLastLogin(api.lastStudyDate),
    status: deriveStatus(api.lastStudyDate, api.lastUnderstanding),
  };
}
