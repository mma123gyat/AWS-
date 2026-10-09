// バックエンドが実際に返す生レスポンスの形。エンドポイントごとにキーの命名規則が
// 統一されていない(teacher.get_students はcamelCase化済みだが、progress系はsnake_caseのまま)
// ため、フロント表示用の型(teacher.ts)とは別に、実態をそのまま表現する型として保持する。

export type CurriculumStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

/** GET /teacher/students のレスポンス要素(ハンドラ内で手動camelCase化済み) */
export interface ApiStudentSummary {
  studentId: string;
  name: string | null;
  lastStudyDate: string | null;
  lastUnderstanding: number | null;
  todayPlanExists: boolean;
}

/** GET /teacher/students/{studentId}/progress のレスポンス要素(snake_caseのまま) */
export interface ApiStudentProgressItem {
  student_progress_id: string;
  student_id: string;
  subject_id: string;
  unit_name: string;
  understanding: number;
  status: CurriculumStatus;
  updated_at: string;
}

/** GET /teacher/classes/{classId}/progress のレスポンス要素(snake_caseのまま) */
export interface ApiCurriculumItem {
  curriculum_id: string;
  class_id: string;
  subject_id: string;
  unit_name: string;
  textbook_page: string;
  status: CurriculumStatus;
  updated_by: string;
  updated_at: string;
}

/** PUT /teacher/students/{studentId}/progress のリクエストボディ(camelCaseを要求) */
export interface PutStudentProgressRequest {
  subjectId: string;
  unitName: string;
  status: CurriculumStatus;
  understanding: number;
}

/** PUT /teacher/classes/{classId}/progress のリクエストボディ(camelCaseを要求) */
export interface PutClassProgressRequest {
  subjectId: string;
  unitName: string;
  textbookPage: string;
  status: CurriculumStatus;
}
