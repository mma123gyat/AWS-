import { apiGet, apiPut } from './client';
import { getMockSharing, saveMockSharing } from '../features/sharing/mockSharing';
import { parseSharing } from '../features/sharing/sharingContract';
import type { SaveSharingRequest, SharingRole, SharingSnapshot } from '../types/sharing';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const paths = { STUDENT: '/students/me/sharing', PARENT: '/parents/me/sharing', SUPPORT: '/support/me/sharing' };

export async function getSharing(role: SharingRole): Promise<SharingSnapshot> {
  return parseSharing(USE_MOCK ? getMockSharing(role) : await apiGet<unknown>(paths[role]), role);
}
export async function saveSharing(role: Exclude<SharingRole, 'SUPPORT'>, payload: SaveSharingRequest): Promise<SharingSnapshot> {
  const result = parseSharing(USE_MOCK ? saveMockSharing(role, payload) : await apiPut<unknown>(paths[role], payload), role, payload.studentId);
  const same = (Object.keys(payload.settings) as (keyof typeof payload.settings)[]).every(group =>
    Object.entries(payload.settings[group]).every(([key, value]) => (result.settings[group] as unknown as Record<string, boolean>)?.[key] === value));
  if (result.version !== payload.version + 1 || !same) throw new Error('保存結果を確認できませんでした。再読み込みしてください。');
  return result;
}
