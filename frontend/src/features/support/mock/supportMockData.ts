// バックエンド未接続でもUIを確認できるようにするための開発用モックデータ。
// VITE_USE_MOCK=true のときのみ api/supportApi.ts から利用される。
import type { ApiSupportReport } from '../../../types/api';

export const mockSupportReport: ApiSupportReport = {
  studentId: 'student-001',
  studentName: 'テスト生徒',
  recentStudyMinutes: 75,
  recentRecordCount: 5,
  subjectProgresses: [
    { subjectId: 'math', subjectName: '数学', understanding: 4, status: 'IN_PROGRESS' },
    { subjectId: 'english', subjectName: '英語', understanding: 2, status: 'NOT_STARTED' },
  ],
  supportNeededSubjects: [
    { subjectId: 'english', subjectName: '英語', reasons: ['理解度が低い教科', '最近学習記録が少ない教科'] },
  ],
  attendance: null,
  attendanceNote: '出席情報はまだ連携されていません。',
};
