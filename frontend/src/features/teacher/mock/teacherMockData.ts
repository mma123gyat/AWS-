// バックエンド未接続でもUIを確認できるようにするための開発用モックデータ。
// VITE_USE_MOCK=true のときのみ api/teacherApi.ts から利用される。
import type {
  ApiCurriculumItem,
  ApiStudentProgressItem,
  ApiStudentSummary,
  ApiTeacherLearningLogs,
} from '../../../types/api';
import type { StudyRecord } from '../../../types/studyRecord';

export const mockStudents: ApiStudentSummary[] = [
  {
    studentId: 'student-001',
    name: '山田 太郎',
    lastStudyDate: new Date().toISOString(),
    lastUnderstanding: 4,
    todayPlanExists: true,
  },
  {
    studentId: 'student-002',
    name: '佐藤 花子',
    lastStudyDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastUnderstanding: 2,
    todayPlanExists: true,
  },
  {
    studentId: 'student-003',
    name: '鈴木 一郎',
    lastStudyDate: null,
    lastUnderstanding: null,
    todayPlanExists: false,
  },
];

function mockRecord(studentId: string, order: number, minutes: number, understanding: StudyRecord['understanding']): StudyRecord {
  const completedAt = new Date(Date.now() - order * 60_000).toISOString();
  const taskId = `demo-plan-${studentId}#${order}`;
  return {
    record_id: `demo-record-${studentId}-${order}`,
    student_id: studentId,
    sort_key: `${completedAt}#${taskId}`,
    task_id: taskId,
    subject_id: studentId === 'student-001' ? 'math' : 'japanese',
    unit_name: studentId === 'student-001' ? '比例・反比例' : '走れメロス',
    actual_minutes: minutes,
    understanding,
    completed_at: completedAt,
  };
}

export const mockTeacherLearningLogs: Record<string, ApiTeacherLearningLogs> = {
  'student-001': {
    studentId: 'student-001', name: '山田 太郎',
    recentRecords: [mockRecord('student-001', 1, 7, 3), mockRecord('student-001', 2, 8, 4)],
  },
  'student-002': {
    studentId: 'student-002', name: '佐藤 花子',
    recentRecords: [mockRecord('student-002', 1, 5, 2)],
  },
  'student-003': { studentId: 'student-003', name: '鈴木 一郎', recentRecords: [] },
};

export const mockStudentProgress: Record<string, ApiStudentProgressItem[]> = {
  'student-001': [
    {
      student_progress_id: 'student-001#subject-math',
      student_id: 'student-001',
      subject_id: 'subject-math',
      unit_name: '分数の計算',
      understanding: 4,
      status: 'IN_PROGRESS',
      updated_at: new Date().toISOString(),
    },
  ],
  'student-002': [
    {
      student_progress_id: 'student-002#subject-math',
      student_id: 'student-002',
      subject_id: 'subject-math',
      unit_name: '分数の計算',
      understanding: 2,
      status: 'IN_PROGRESS',
      updated_at: new Date().toISOString(),
    },
  ],
};

export const mockClassProgress: ApiCurriculumItem[] = [
  {
    curriculum_id: 'class-001#subject-math',
    class_id: 'class-001',
    subject_id: 'subject-math',
    unit_name: '分数の計算',
    textbook_page: 'p.42',
    status: 'COMPLETED',
    updated_by: 'teacher-001',
    updated_at: new Date().toISOString(),
  },
];
