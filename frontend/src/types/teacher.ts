export interface Student {
  id: string;
  name: string;
  understanding: number | null; // 1-5; no progress-rate conversion
  lastLogin: string;
  // UNSUBMITTED is a legacy internal key meaning 記録を確認, not a missed submission.
  status: 'NORMAL' | 'WARNING' | 'UNSUBMITTED';
}

export interface AiParameters {
  difficulty: number;
  volume: number;
  supportLevel: number;
}

export interface AiParameterSettings {
  studentId: string;
  params: AiParameters;
  updatedAt: string | null;
}

export interface SchoolProgressFormInput {
  subjectId: string;
  unitName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  textbookPage: string;
}
