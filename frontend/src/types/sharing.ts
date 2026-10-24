export type SharingRole = 'STUDENT' | 'PARENT' | 'SUPPORT';
export interface SharingSettings {
  parent: { studySummary: boolean; messages: boolean };
  support: { studySummary: boolean; subjectProgress: boolean; messages: boolean };
}
export interface SharingSnapshot {
  studentId: string;
  studentName: string | null;
  settings: { parent?: SharingSettings['parent']; support: SharingSettings['support'] };
  version: number;
  updatedAt: string | null;
  updatedByRole: 'STUDENT' | 'PARENT' | null;
  isLegacyDefault: boolean;
  canSendMessage: boolean;
}
export interface SaveSharingRequest {
  studentId: string;
  settings: SharingSettings;
  version: number;
}
