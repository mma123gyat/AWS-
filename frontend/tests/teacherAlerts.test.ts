import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApiStudentSummary } from '../src/types/api.ts';
import { assessStudent, calendarDaysSince, collectTeacherAlerts } from '../src/features/teacher/utils/teacherAlerts.ts';
import { deriveStatus, formatLastLogin } from '../src/features/teacher/utils/studentStatus.ts';

const NOW = Date.parse('2026-10-24T03:00:00Z');
function student(overrides: Partial<ApiStudentSummary> = {}): ApiStudentSummary {
  return { studentId: 'student-1', name: '生徒1', lastStudyDate: '2026-10-24T01:00:00Z', lastUnderstanding: 3, todayPlanExists: true, ...overrides };
}
const codes = (value: ApiStudentSummary, now = NOW) => assessStudent(value, now).reasons.map(reason => reason.code);

test('直近の理解度1〜2を声かけ候補にし、3〜5は確認事項なしになる', () => {
  for (const lastUnderstanding of [1, 2]) {
    const result = assessStudent(student({ lastUnderstanding }), NOW);
    assert.equal(result.status, 'WARNING');
    assert.deepEqual(result.reasons.map(reason => reason.code), ['LOW_UNDERSTANDING']);
  }
  for (const lastUnderstanding of [3, 4, 5]) assert.equal(assessStudent(student({ lastUnderstanding }), NOW).status, 'NORMAL');
});

test('記録の空きは日本時間の3日を境に判定し、1〜2日は候補にしない', () => {
  assert.deepEqual(codes(student({ lastStudyDate: '2026-10-21T14:59:59Z' })), ['RECORD_GAP']);
  assert.deepEqual(codes(student({ lastStudyDate: '2026-10-21T15:00:00Z' })), []);
  assert.equal(calendarDaysSince('2026-10-21T14:59:59Z', NOW), 3);
  assert.equal(calendarDaysSince('2026-10-21T15:00:00Z', NOW), 2);
});

test('PCのタイムゾーンや24時間の経過ではなく日本時間の日付で計算する', () => {
  const midnight = Date.parse('2026-10-23T15:00:00Z');
  assert.equal(calendarDaysSince('2026-10-23T14:59:59Z', midnight), 1);
  assert.equal(calendarDaysSince('2026-10-23T23:59:59+09:00', midnight), 1);
});

test('低理解度と記録の空きが重なっても1人1行で両方の理由を表示する', () => {
  const input = [student({ lastStudyDate: '2026-10-20T00:00:00Z', lastUnderstanding: 2 })];
  const alerts = collectTeacherAlerts(input, NOW);
  assert.equal(alerts.length, 1);
  assert.deepEqual(alerts[0].reasons.map(reason => reason.code), ['LOW_UNDERSTANDING', 'RECORD_GAP']);
});

test('記録なしは未提出と断定せず、利用状況を確認する別の区分にする', () => {
  const result = assessStudent(student({ lastStudyDate: null, lastUnderstanding: null }), NOW);
  assert.equal(result.status, 'UNSUBMITTED');
  assert.deepEqual(result.reasons.map(reason => reason.code), ['NO_RECORD']);
  assert.doesNotMatch(result.reasons[0].message, /未提出|欠席/);
});

test('欠損・不正・未来の日時は、順調や長期未学習として扱わない', () => {
  for (const lastStudyDate of ['', 'bad', '2026-02-30T00:00:00Z', '2026-10-24T04:00:00Z', '2026-10-24T01:00:00', undefined]) {
    const result = assessStudent(student({ lastStudyDate } as Partial<ApiStudentSummary>), NOW);
    assert.equal(result.status, 'UNSUBMITTED');
    assert.deepEqual(result.reasons.map(reason => reason.code), ['INVALID_RECORD']);
  }
});

test('不正・欠けた理解度を低理解度や確認事項なしに置き換えない', () => {
  for (const value of [0, 6, 1.5, null, NaN, '2', undefined]) {
    const result = assessStudent(student({ lastUnderstanding: value } as Partial<ApiStudentSummary>), NOW);
    assert.equal(result.status, 'UNSUBMITTED');
    assert.deepEqual(result.reasons.map(reason => reason.code), ['INVALID_RECORD']);
  }
});

test('声かけ候補を先に並べ、入力順や入力オブジェクトを変更しない', () => {
  const input = [student({ studentId: 'none', lastStudyDate: null }), student({ studentId: 'normal' }), student({ studentId: 'low', lastUnderstanding: 2 }), student({ studentId: 'gap', lastStudyDate: '2026-10-01T00:00:00Z' })];
  const before = structuredClone(input);
  assert.deepEqual(collectTeacherAlerts(input, NOW).map(alert => alert.student.studentId), ['low', 'gap', 'none']);
  assert.deepEqual(input, before);
  assert.deepEqual(collectTeacherAlerts([], NOW), []);
});

test('プランの有無だけで未提出や声かけ候補と判定しない', () => {
  assert.deepEqual(assessStudent(student({ todayPlanExists: false }), NOW), assessStudent(student({ todayPlanExists: true }), NOW));
});

test('ダッシュボードと生徒一覧も同じ判定を使い、日時不明を今日と表示しない', () => {
  const original = Date.now;
  Date.now = () => NOW;
  try {
    for (const item of [student(), student({ lastUnderstanding: 1 }), student({ lastStudyDate: null }), student({ lastStudyDate: '2026-10-20T00:00:00Z' })]) {
      assert.equal(deriveStatus(item.lastStudyDate, item.lastUnderstanding), assessStudent(item, NOW).status);
    }
    assert.equal(formatLastLogin('bad'), '日時不明');
    assert.equal(formatLastLogin(null), '記録なし');
    assert.equal(formatLastLogin('2026-10-24T01:00:00Z'), '今日');
    assert.equal(formatLastLogin('2026-10-23T01:00:00Z'), '1日前');
  } finally { Date.now = original; }
});
