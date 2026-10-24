import { deriveStatus, formatLastLogin } from '../../features/teacher/utils/studentStatus';
import type { ApiStudentSummary } from '../../types/api';
import type { Student } from '../../types/teacher';

export function toStudent(api: ApiStudentSummary): Student {
  return {
    id: api.studentId,
    name: api.name ?? '(名前未設定)',
    understanding: typeof api.lastUnderstanding === 'number' && Number.isInteger(api.lastUnderstanding)
      && api.lastUnderstanding >= 1 && api.lastUnderstanding <= 5 ? api.lastUnderstanding : null,
    lastLogin: formatLastLogin(api.lastStudyDate),
    status: deriveStatus(api.lastStudyDate, api.lastUnderstanding),
  };
}
