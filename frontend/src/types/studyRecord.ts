export type Understanding = 1 | 2 | 3 | 4 | 5;

export interface StudyRecord {
  record_id: string;
  student_id: string;
  sort_key: string;
  task_id: string;
  subject_id: string;
  unit_name: string;
  actual_minutes: number;
  understanding: Understanding;
  completed_at: string;
}
