// バックエンド未接続でもUIを確認できるようにするための開発用モックデータ。
// VITE_USE_MOCK=true のときのみ api/teacherApi.ts から利用される。
import type {
  ApiCurriculumItem,
  ApiStudentProgressItem,
  ApiStudentSummary,
  ApiTeacherLearningLogs,
} from '../../../types/api';
import type { LearningHistory, SubjectLearningHistory } from '../../../types/learningHistory';
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

/** Mock mode only: aggregate the same records shown in the mock learning log. */
export function getMockLearningHistory(studentId: string): LearningHistory | null {
  const logs = mockTeacherLearningLogs[studentId];
  if (!logs) return null;
  const generatedAt = new Date().toISOString();
  const endDate = new Date(Date.parse(generatedAt) + 9 * 3_600_000).toISOString().slice(0, 10);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const dates = Array.from({ length: 7 }, (_, index) => new Date(end - (6 - index) * 86_400_000).toISOString().slice(0, 10));
  const days = dates.map(date => ({ date, minutes: 0, recordCount: 0 }));
  const subjects = new Map<string, SubjectLearningHistory>();
  const records = [...logs.recentRecords].sort((a, b) => Date.parse(a.completed_at) - Date.parse(b.completed_at));
  for (const record of records) {
    const date = new Date(Date.parse(record.completed_at) + 9 * 3_600_000).toISOString().slice(0, 10);
    const index = dates.indexOf(date);
    if (index < 0) continue;
    days[index].minutes += record.actual_minutes;
    days[index].recordCount += 1;
    if (!subjects.has(record.subject_id)) {
      subjects.set(record.subject_id, { subjectId: record.subject_id, days: dates.map(date => ({ date, understanding: null, recordCount: 0, unitName: null, completedAt: null })) });
    }
    const point = subjects.get(record.subject_id)!.days[index];
    point.understanding = record.understanding;
    point.recordCount += 1;
    point.unitName = record.unit_name;
    point.completedAt = record.completed_at;
  }
  return {
    studentId, name: logs.name, startDate: dates[0], endDate, timeZone: 'Asia/Tokyo', generatedAt,
    recordCount: days.reduce((sum, day) => sum + day.recordCount, 0), unassignedRecordCount: 0,
    totalMinutes: days.reduce((sum, day) => sum + day.minutes, 0), days, subjects: [...subjects.values()],
  };
}
