import type { SharingRole, SharingSnapshot } from '../../types/sharing';

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function flags(value: unknown, keys: string[]): boolean {
  return object(value) && Object.keys(value).length === keys.length && keys.every(key => typeof value[key] === 'boolean');
}

export function parseSharing(value: unknown, role: SharingRole, expectedStudentId?: string): SharingSnapshot {
  const fail = () => { throw new Error('共有設定の応答を確認できませんでした。再読み込みしてください。'); };
  if (!object(value) || typeof value.studentId !== 'string' || !value.studentId ||
      (expectedStudentId !== undefined && value.studentId !== expectedStudentId) ||
      (value.studentName !== null && typeof value.studentName !== 'string') ||
      !Number.isSafeInteger(value.version) || (value.version as number) < 0 ||
      typeof value.isLegacyDefault !== 'boolean' || typeof value.canSendMessage !== 'boolean' ||
      (value.updatedAt !== null && (typeof value.updatedAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value.updatedAt) || !Number.isFinite(Date.parse(value.updatedAt)))) ||
      ![null, 'STUDENT', 'PARENT'].includes(value.updatedByRole as string | null) || !object(value.settings)) return fail();
  if (!flags(value.settings.support, ['studySummary', 'subjectProgress', 'messages']) ||
      (role !== 'SUPPORT' && !flags(value.settings.parent, ['studySummary', 'messages']))) return fail();
  const snapshot = value as unknown as SharingSnapshot;
  if (role !== 'SUPPORT' && snapshot.canSendMessage !== (snapshot.settings.support.messages && snapshot.settings.parent!.messages)) return fail();
  if (snapshot.canSendMessage && !snapshot.settings.support.messages) return fail();
  if (snapshot.isLegacyDefault ? snapshot.version !== 0 || snapshot.updatedAt !== null || snapshot.updatedByRole !== null
    : snapshot.updatedAt === null || snapshot.updatedByRole === null) return fail();
  return structuredClone(snapshot);
}
