import type { LearningHistory } from '../../../types/learningHistory';

const DAY_MS = 86_400_000;
const JST_MS = 9 * 60 * 60 * 1000;
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isText = (value: unknown) => value === null || typeof value === 'string';
const isTimestamp = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const date = value.slice(0, 10);
  const day = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(day) && new Date(day).toISOString().slice(0, 10) === date && Number.isFinite(Date.parse(value));
};
const jstDate = (value: string) => new Date(Date.parse(value) + JST_MS).toISOString().slice(0, 10);

export function formatHistoryDate(value: string): string {
  return value.replaceAll('-', '/');
}

/** Reject incomplete/truncated or wrong-student data rather than graphing fake zeros. */
export function validateLearningHistory(value: unknown, studentId: string): LearningHistory {
  const fail = (): never => { throw new Error('学習履歴の応答形式を確認できませんでした。再読み込みしてください。'); };
  if (!isObject(value) || value.studentId !== studentId || !isText(value.name)
    || value.timeZone !== 'Asia/Tokyo' || !isTimestamp(value.generatedAt)
    || typeof value.startDate !== 'string' || typeof value.endDate !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(value.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(value.endDate)
    || !isCount(value.recordCount) || !isCount(value.unassignedRecordCount)
    || !(value.totalMinutes === null || isCount(value.totalMinutes))
    || !Array.isArray(value.days) || value.days.length !== 7 || !Array.isArray(value.subjects)) return fail();
  const start = Date.parse(`${value.startDate}T00:00:00Z`);
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10) !== value.startDate) return fail();
  const dates = Array.from({ length: 7 }, (_, index) => new Date(start + index * DAY_MS).toISOString().slice(0, 10));
  if (dates[6] !== value.endDate || jstDate(value.generatedAt) !== value.endDate) return fail();
  let totalRecords = 0;
  let totalMinutes: number | null = 0;
  const dayCounts: number[] = [];
  for (const [index, day] of value.days.entries()) {
    if (!isObject(day) || day.date !== dates[index] || !isCount(day.recordCount)
      || !(day.minutes === null || isCount(day.minutes))
      || (day.recordCount === 0 && day.minutes !== 0 && day.minutes !== null)
      || (day.recordCount > 0 && day.minutes === 0)) return fail();
    dayCounts.push(day.recordCount);
    totalRecords += day.recordCount;
    totalMinutes = totalMinutes === null || day.minutes === null ? null : totalMinutes + day.minutes;
  }
  if (totalMinutes !== null && !Number.isSafeInteger(totalMinutes)) totalMinutes = null;
  if (totalRecords !== value.recordCount || totalMinutes !== value.totalMinutes
    || (value.unassignedRecordCount > 0 && value.days.some(day => day.minutes !== null))) return fail();
  const subjectKeys = new Set<string>();
  const subjectCounts = Array<number>(7).fill(0);
  for (const subject of value.subjects) {
    if (!isObject(subject) || !isText(subject.subjectId) || (typeof subject.subjectId === 'string' && !subject.subjectId.trim())
      || !Array.isArray(subject.days) || subject.days.length !== 7) return fail();
    const key = JSON.stringify(subject.subjectId);
    if (subjectKeys.has(key)) return fail();
    subjectKeys.add(key);
    let records = 0;
    for (const [index, point] of subject.days.entries()) {
      if (!isObject(point) || point.date !== dates[index] || !isCount(point.recordCount) || !isText(point.unitName)
        || !(point.understanding === null || (isCount(point.understanding) && point.understanding >= 1 && point.understanding <= 5))) return fail();
      if (point.recordCount === 0) {
        if (point.understanding !== null || point.completedAt !== null || point.unitName !== null) return fail();
      } else if (!isTimestamp(point.completedAt) || jstDate(point.completedAt) !== point.date || Date.parse(point.completedAt) > Date.parse(value.generatedAt)) return fail();
      records += point.recordCount;
      subjectCounts[index] += point.recordCount;
    }
    if (records === 0) return fail();
  }
  if (subjectCounts.some((count, index) => count !== dayCounts[index])) return fail();
  return value as unknown as LearningHistory;
}
