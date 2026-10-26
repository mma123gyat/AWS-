export type InviteRole = 'STUDENT' | 'PARENT' | 'SUPPORT'
export type Invitation = {
  email: string; name: string; role: InviteRole; studentId: string | null
  status: 'PROVISIONING' | 'SENDING' | 'SENT' | 'DELIVERY_UNKNOWN'
  created_at: string; last_sent_at: string | null
}
export type InvitationData = {
  classId: string; className: string | null
  students: { studentId: string; name: string }[]; invitations: Invitation[]
}
export function readInvitation(value: unknown): Invitation {
  if (!value || typeof value !== 'object') throw new Error('招待の応答を確認できませんでした。')
  const item = value as Invitation
  if (typeof item.email !== 'string' || typeof item.name !== 'string'
    || !['STUDENT', 'PARENT', 'SUPPORT'].includes(item.role)
    || !['PROVISIONING', 'SENDING', 'SENT', 'DELIVERY_UNKNOWN'].includes(item.status)
    || (item.role === 'STUDENT' ? item.studentId !== null : typeof item.studentId !== 'string')
    || typeof item.created_at !== 'string'
    || (item.last_sent_at !== null && typeof item.last_sent_at !== 'string')) {
    throw new Error('招待の応答を確認できませんでした。')
  }
  return { ...item }
}
