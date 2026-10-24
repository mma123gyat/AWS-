import assert from 'node:assert/strict';
import test from 'node:test';
import type { LearningHistory } from '../src/types/learningHistory.ts';
import { formatHistoryDate, validateLearningHistory } from '../src/features/teacher/utils/learningHistory.ts';

function empty(): LearningHistory {
  const dates = Array.from({ length: 7 }, (_, index) => `2026-10-${18 + index}`);
  return {
    studentId: 'student-1', name: 'テスト生徒', startDate: dates[0], endDate: dates[6], timeZone: 'Asia/Tokyo',
    generatedAt: '2026-10-24T04:00:00Z', recordCount: 0, unassignedRecordCount: 0, totalMinutes: 0,
    days: dates.map(date => ({ date, minutes: 0, recordCount: 0 })), subjects: [],
  };
}

function recorded(): LearningHistory {
  const value = empty();
  value.recordCount = 2;
  value.totalMinutes = 15;
  value.days[5] = { date: '2026-10-23', minutes: 15, recordCount: 2 };
  value.subjects = [{ subjectId: 'math', days: value.days.map((day, index) => ({
    date: day.date, understanding: index === 5 ? 4 : null, recordCount: index === 5 ? 2 : 0,
    unitName: index === 5 ? '反比例' : null, completedAt: index === 5 ? '2026-10-23T04:01:00Z' : null,
  })) }];
  return value;
}
const validate = (value: unknown) => validateLearningHistory(value, 'student-1');

test('7日間の0分と理解度の未記録を区別できる応答を受け付ける', () => {
  assert.equal(validate(empty()).totalMinutes, 0);
  assert.equal(validate(empty()).subjects.length, 0);
  const data = validate(recorded());
  assert.equal(data.totalMinutes, 15);
  assert.equal(data.subjects[0].days[5].understanding, 4);
  assert.equal(data.subjects[0].days[4].understanding, null);
});

test('別の生徒・欠けた応答・異なるタイムゾーンを拒否する', () => {
  for (const value of [null, {}, { ...empty(), studentId: 'other' }, { ...empty(), timeZone: 'UTC' }]) assert.throws(() => validate(value));
});

test('7日分が揃わない・日付が重複する・順序が違う応答を拒否する', () => {
  let data = recorded(); data.days.pop(); assert.throws(() => validate(data));
  data = recorded(); data.days[0].date = data.days[1].date; assert.throws(() => validate(data));
  data = recorded(); data.days.reverse(); assert.throws(() => validate(data));
  assert.throws(() => validate({ ...empty(), startDate: '2026-02-30' }));
  assert.throws(() => validate({ ...empty(), endDate: '2026-10-25' }));
});

test('日別時間と件数に一致しない期間合計を受け付けない', () => {
  assert.throws(() => validate({ ...recorded(), totalMinutes: 7 }));
  assert.throws(() => validate({ ...recorded(), recordCount: 1 }));
  const data = recorded(); data.days[5].minutes = -1; assert.throws(() => validate(data));
});

test('不明な学習時間を0分で代用せず、合計も不明にする', () => {
  const data = recorded(); data.days[5].minutes = null; data.totalMinutes = null;
  assert.equal(validate(data).totalMinutes, null);
  data.totalMinutes = 0; assert.throws(() => validate(data));
  data.totalMinutes = null; data.days[5].minutes = 0; assert.throws(() => validate(data));
});

test('日時を割り当てられない記録がある場合は日別合計を表示しない', () => {
  const data = recorded(); data.unassignedRecordCount = 1; data.totalMinutes = null;
  data.days.forEach(day => { day.minutes = null; });
  assert.equal(validate(data).unassignedRecordCount, 1);
  data.days[5].minutes = 15; assert.throws(() => validate(data));
});

test('理解度は1〜5か未記録のみで、0や百分率に変換しない', () => {
  for (const value of [0, 6, 3.5, 80, true, '4']) {
    const data = recorded(); (data.subjects[0].days[5] as unknown as Record<string, unknown>).understanding = value;
    assert.throws(() => validate(data));
  }
  const data = recorded(); data.subjects[0].days[5].understanding = null;
  assert.equal(validate(data).subjects[0].days[5].understanding, null);
});

test('記録なしの日に架空の理解度や単元を補わない', () => {
  const data = recorded(); data.subjects[0].days[0].understanding = 1;
  assert.throws(() => validate(data));
});

test('教科別の件数が合わない・教科が重複する応答を拒否する', () => {
  const data = recorded(); data.subjects[0].days[5].recordCount = 1;
  assert.throws(() => validate(data));
  const duplicate = recorded(); duplicate.subjects.push(structuredClone(duplicate.subjects[0]));
  assert.throws(() => validate(duplicate));
  const unknown = recorded(); unknown.subjects[0].subjectId = null;
  assert.equal(validate(unknown).subjects[0].subjectId, null);
});

test('理解度の日時は日本時間の日付に対応し、取得時点を超えない', () => {
  const data = recorded(); data.subjects[0].days[5].completedAt = '2026-10-22T15:00:00Z';
  assert.equal(validate(data).subjects[0].days[5].understanding, 4);
  for (const completedAt of ['2026-10-22T14:59:59Z', '2026-10-25T01:00:00Z', '2026-02-30T00:00:00Z', '2026-10-23T04:00:00']) {
    data.subjects[0].days[5].completedAt = completedAt; assert.throws(() => validate(data));
  }
});

test('表示用の日付は実行端末のタイムゾーンでずれない', () => {
  assert.equal(formatHistoryDate('2026-10-18'), '2026/10/18');
  assert.equal(validate(recorded()).endDate, '2026-10-24');
  assert.throws(() => validate({ ...empty(), generatedAt: '2026-10-24T16:00:00Z' }));
});
