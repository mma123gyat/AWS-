import type { StudyRecord } from '../../../types/studyRecord';

const SUBJECT_NAMES: Record<string, string> = {
  math: '数学', english: '英語', japanese: '国語', science: '理科', social: '社会',
};
const UNDERSTANDING_LABELS = [
  'もう一度確認したい', '少しわかった', 'だいたいわかった', 'よくわかった', '自分でできる',
];
const DATE_FORMAT = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function timestamp(value: unknown): number {
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

export function formatLogDate(value: unknown): string {
  const time = timestamp(value);
  return Number.isFinite(time) ? DATE_FORMAT.format(time) : '日時不明';
}

export function formatSubject(value: unknown): string {
  return typeof value === 'string' && value.trim() ? SUBJECT_NAMES[value] ?? value : '—';
}

export function formatUnderstanding(value: unknown): string {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
    ? `${value}/5：${UNDERSTANDING_LABELS[value - 1]}`
    : '—';
}

export function validMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function latestLearningRecords(records: StudyRecord[]): StudyRecord[] {
  return [...records].sort((a, b) => {
    const left = timestamp(a.completed_at);
    const right = timestamp(b.completed_at);
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
    return Number.isFinite(right) ? right - left : -1;
  }).slice(0, 20);
}

export function totalLearningMinutes(records: StudyRecord[]): number | null {
  if (records.some(record => !validMinutes(record.actual_minutes))) return null;
  const total = records.reduce((sum, record) => sum + record.actual_minutes, 0);
  return Number.isSafeInteger(total) ? total : null;
}
