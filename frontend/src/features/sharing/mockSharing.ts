import type { SaveSharingRequest, SharingRole, SharingSnapshot } from '../../types/sharing';
import { ApiError } from '../../api/client';

let snapshot: SharingSnapshot = {
  studentId: 'student-001', studentName: 'テスト生徒', version: 0,
  updatedAt: null, updatedByRole: null, isLegacyDefault: true, canSendMessage: true,
  settings: {
    parent: { studySummary: true, messages: true },
    support: { studySummary: true, subjectProgress: true, messages: true },
  },
};
export function getMockSharing(role: SharingRole): SharingSnapshot {
  const copy = structuredClone(snapshot);
  if (role === 'SUPPORT') delete copy.settings.parent;
  return copy;
}
export function saveMockSharing(role: SharingRole, request: SaveSharingRequest): SharingSnapshot {
  if (role === 'SUPPORT') throw new ApiError('FORBIDDEN', '共有設定を変更できません。', 403);
  if (request.studentId !== snapshot.studentId || request.version !== snapshot.version) {
    throw new ApiError('CONFLICT', '共有設定が変更されました。再読み込みしてください。', 409);
  }
  snapshot = { ...snapshot, settings: structuredClone(request.settings), version: snapshot.version + 1,
    updatedAt: new Date().toISOString(), updatedByRole: role, isLegacyDefault: false,
    canSendMessage: request.settings.support.messages && request.settings.parent.messages };
  return getMockSharing(role);
}
