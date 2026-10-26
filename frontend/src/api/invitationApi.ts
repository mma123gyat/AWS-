import { apiGet, apiPost } from './client'

import { readInvitation } from '../features/teacher/utils/invitations'
import type { Invitation, InvitationData, InviteRole } from '../features/teacher/utils/invitations'
export type { Invitation, InvitationData, InviteRole } from '../features/teacher/utils/invitations'
export async function getInvitations(): Promise<InvitationData> {
  if (import.meta.env.VITE_USE_MOCK === 'true') throw new Error('招待機能の確認には実API接続を使用してください。')
  const value = await apiGet<InvitationData>('/teacher/invitations')
  if (!value || typeof value.classId !== 'string' || !value.classId
    || (value.className !== null && typeof value.className !== 'string')
    || !Array.isArray(value.students) || value.students.some(item => !item || typeof item.studentId !== 'string' || typeof item.name !== 'string')
    || !Array.isArray(value.invitations)) throw new Error('招待一覧の応答を確認できませんでした。')
  return { ...value, invitations: value.invitations.map(readInvitation) }
}
export async function sendInvitation(input: {
  email: string; name: string; role: InviteRole; classId: string; studentId: string | null
  operation: 'CREATE' | 'RESEND'
}): Promise<Invitation> {
  if (import.meta.env.VITE_USE_MOCK === 'true') throw new Error('招待機能の確認には実API接続を使用してください。')
  return readInvitation(await apiPost('/teacher/invitations', input))
}
