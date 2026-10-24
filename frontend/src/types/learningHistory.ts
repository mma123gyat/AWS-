export interface LearningDay {
  date: string;
  minutes: number | null;
  recordCount: number;
}

export interface UnderstandingDay {
  date: string;
  understanding: number | null;
  recordCount: number;
  unitName: string | null;
  completedAt: string | null;
}

export interface SubjectLearningHistory {
  subjectId: string | null;
  days: UnderstandingDay[];
}

export interface LearningHistory {
  studentId: string;
  name: string | null;
  startDate: string;
  endDate: string;
  timeZone: 'Asia/Tokyo';
  generatedAt: string;
  recordCount: number;
  unassignedRecordCount: number;
  totalMinutes: number | null;
  days: LearningDay[];
  subjects: SubjectLearningHistory[];
}
