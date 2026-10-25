import type { ApiBadge, ApiMessageItem, ApiParentDashboard } from '../../../types/api';

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** Keep private (null), actual zero and a malformed response distinct. */
export function readParentDashboard(value: unknown): ApiParentDashboard {
  const fail = (): never => { throw new Error('学習状況の応答を確認できませんでした。再読み込みしてください。'); };
  if (!object(value) || (value.studentName !== null && typeof value.studentName !== 'string')) return fail();
  const summary = [value.weeklyStudyMinutes, value.studiedDays, value.recordCount];
  const privateSummary = summary.every(item => item === null);
  const visibleSummary = summary.every(count) && (value.studiedDays as number) <= 7
    && (value.studiedDays as number) <= (value.recordCount as number)
    && (value.recordCount !== 0 || (value.weeklyStudyMinutes === 0 && value.studiedDays === 0));
  if (!privateSummary && !visibleSummary) return fail();
  if (privateSummary ? value.badges !== null : !Array.isArray(value.badges)) return fail();
  if (Array.isArray(value.badges)) {
    const ids = new Set<string>();
    for (const badge of value.badges) {
      if (!object(badge) || typeof badge.id !== 'string' || !badge.id.trim() || ids.has(badge.id)
        || typeof badge.label !== 'string' || !badge.label.trim() || typeof badge.earned !== 'boolean') return fail();
      ids.add(badge.id);
    }
  }
  if (value.messages !== null) {
    if (!Array.isArray(value.messages)) return fail();
    const ids = new Set<string>();
    for (const message of value.messages) {
      if (!object(message) || typeof message.message_id !== 'string' || !message.message_id.trim()
        || ids.has(message.message_id) || typeof message.body !== 'string' || typeof message.sender_role !== 'string') return fail();
      ids.add(message.message_id);
    }
  }
  return structuredClone(value) as unknown as ApiParentDashboard;
}

function messageTimestamp(value: unknown): number {
  if (typeof value !== 'string') return NaN;
  const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) return NaN;
  return Date.parse(value);
}

export function formatParentDate(value: unknown): string {
  const timestamp = messageTimestamp(value);
  if (!Number.isFinite(timestamp)) return '日時不明';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(timestamp);
}

export function newestMessages(messages: ApiMessageItem[]): ApiMessageItem[] {
  return [...messages].sort((left, right) => {
    const a = messageTimestamp(left.created_at), b = messageTimestamp(right.created_at);
    if (!Number.isFinite(a)) return Number.isFinite(b) ? 1 : 0;
    return Number.isFinite(b) ? b - a : -1;
  });
}

const BADGE_COPY: Record<string, { label: string; description: string }> = {
  streak_3: { label: '3日学習できた', description: '直近7日間で、学習の記録がある日が3日以上' },
  streak_5: { label: '5日学習できた', description: '直近7日間で、学習の記録がある日が5日以上' },
  understanding_up: { label: 'よくわかった記録', description: '直近7日間に、理解度4・5の記録がある' },
  hour_challenge: { label: '60分の積み重ね', description: '直近7日間の記録された学習時間が合計60分以上' },
};
export function badgeCopy(badge: ApiBadge) {
  return BADGE_COPY[badge.id] ?? { label: badge.label, description: '学習の記録に応じたスタンプです。' };
}
export function senderLabel(role: string): string {
  return role === 'SUPPORT' ? '支援担当者' : role === 'TEACHER' ? '先生' : '送信者';
}
