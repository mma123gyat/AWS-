export interface Student {
  id: string;
  name: string;
  progress: number; // 0-100%
  lastLogin: string;
  // UNSUBMITTED is a legacy internal key meaning 記録を確認, not a missed submission.
  status: 'NORMAL' | 'WARNING' | 'UNSUBMITTED';
}

export interface ProgressData {
  month: string;
  schoolProgress: number;
  studentProgress: number;
}

export interface AiParameters {
  difficulty: number;
  volume: number;
  supportLevel: number;
}

export interface SchoolProgressFormInput {
  subjectId: string;
  unitName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  textbookPage: string;
}
