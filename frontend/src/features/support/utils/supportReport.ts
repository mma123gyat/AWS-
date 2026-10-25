import type { ApiSupportReport, ApiSupportSubjectProgress } from '../../../types/api';

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

/** Private nulls, actual zero and invalid responses must remain distinct. */
export function readSupportReport(value: unknown): ApiSupportReport {
  const fail = (): never => { throw new Error('レポートの応答を確認できませんでした。再読み込みしてください。'); };
  if (!object(value) || !text(value.studentId) || (value.studentName !== null && typeof value.studentName !== 'string')
    || typeof value.canSendMessage !== 'boolean' || value.attendance !== null || !text(value.attendanceNote)) return fail();
  const summary = [value.recentStudyMinutes, value.recentRecordCount];
  if (!summary.every(item => item === null) && !(summary.every(count)
    && (value.recentRecordCount !== 0 || value.recentStudyMinutes === 0))) return fail();
  if (value.subjectProgresses === null || value.supportNeededSubjects === null) {
    if (value.subjectProgresses !== null || value.supportNeededSubjects !== null) return fail();
  } else {
    if (!Array.isArray(value.subjectProgresses) || !Array.isArray(value.supportNeededSubjects)) return fail();
    const ids = new Set<string>();
    for (const subject of value.subjectProgresses) {
      if (!object(subject) || !text(subject.subjectId) || ids.has(subject.subjectId) || !text(subject.subjectName)
        || (subject.understanding !== null && !(count(subject.understanding) && subject.understanding >= 1 && subject.understanding <= 5))
        || ![null, 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(subject.status as null | string)) return fail();
      ids.add(subject.subjectId);
    }
    const checked = new Set<string>();
    for (const subject of value.supportNeededSubjects) {
      if (!object(subject) || !text(subject.subjectId) || !ids.has(subject.subjectId) || checked.has(subject.subjectId)
        || !text(subject.subjectName) || !Array.isArray(subject.reasons) || !subject.reasons.length || !subject.reasons.every(text)) return fail();
      checked.add(subject.subjectId);
    }
  }
  return structuredClone(value) as unknown as ApiSupportReport;
}

export function statusLabel(status: ApiSupportSubjectProgress['status']): string {
  return status === 'NOT_STARTED' ? '未着手' : status === 'IN_PROGRESS' ? '進行中' : status === 'COMPLETED' ? '完了' : '未登録';
}
export function understandingLabel(value: number | null): string {
  return value === null ? '未登録' : `${value} / 5`;
}
export function reasonLabel(reason: string, understanding: number | null): string {
  if (reason === '理解度が低い教科') return understanding !== null && understanding <= 2 ? '理解度1・2の記録があります' : '理解度の記録を確認してください';
  if (reason === '最近学習記録が少ない教科') return '直近7日間に、この教科の学習記録がありません';
  return reason;
}
export function messageLength(body: string): number { return Array.from(body.trim()).length; }

export function supportReportDates(iso: string): { fetched: string; period: string } {
  const date = new Date(iso);
  const dateFormat = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
  const fetched = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  const today = dateFormat.format(date);
  const start = new Date(`${today.replaceAll('/', '-')}T00:00:00+09:00`);
  start.setTime(start.getTime() - 6 * 24 * 60 * 60 * 1000);
  return { fetched, period: `${dateFormat.format(start)}〜${today}` };
}
