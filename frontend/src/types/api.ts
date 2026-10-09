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

/** メッセージ(messages_repository.put_messageの戻り値、snake_caseのまま) */
export interface ApiMessageItem {
  message_id: string;
  student_id: string;
  sort_key: string;
  sender_user_id: string;
  sender_role: string;
  body: string;
  created_at: string;
}

/** がんばりスタンプ(backend/src/utils/badge_rules.pyの戻り値) */
export interface ApiBadge {
  id: string;
  label: string;
  earned: boolean;
}

/** GET /parents/me/dashboard のレスポンス(ハンドラ内でcamelCase化済み。messagesのみ生のまま) */
export interface ApiParentDashboard {
  studentName: string | null;
  weeklyStudyMinutes: number;
  studiedDays: number;
  recordCount: number;
  badges: ApiBadge[];
  messages: ApiMessageItem[];
}

/** GET /support/me/report のレスポンス要素: 教科ごとの状況 */
export interface ApiSupportSubjectProgress {
  subjectId: string;
  subjectName: string;
  understanding: number | null;
  status: CurriculumStatus | null;
}

/** GET /support/me/report のレスポンス要素: 支援が必要そうな教科(診断ではなく教育上の事実のみ) */
export interface ApiSupportNeededSubject {
  subjectId: string;
  subjectName: string;
  reasons: string[];
}

/** GET /support/me/report のレスポンス(ハンドラ内でcamelCase化済み) */
export interface ApiSupportReport {
  studentId: string;
  studentName: string | null;
  recentStudyMinutes: number;
  recentRecordCount: number;
  subjectProgresses: ApiSupportSubjectProgress[];
  supportNeededSubjects: ApiSupportNeededSubject[];
  /** 教員側の出席・評価連携画面が未実装のため、現時点では常にnull */
  attendance: null;
  attendanceNote: string;
}

/** POST /support/me/messages のリクエストボディ */
export interface PostSupportMessageRequest {
  body: string;
}
