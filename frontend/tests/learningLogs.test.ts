import assert from 'node:assert/strict';
import test from 'node:test';
import type { StudyRecord } from '../src/types/studyRecord.ts';
import {
  formatLogDate, formatSubject, formatUnderstanding, latestLearningRecords, totalLearningMinutes,
} from '../src/features/teacher/utils/learningLogs.ts';

function record(overrides: Partial<StudyRecord> = {}): StudyRecord {
  return {
    record_id: 'record-1', student_id: 'student-1', sort_key: 'date#task',
    task_id: 'plan-1#1', subject_id: 'math', unit_name: '比例', actual_minutes: 7,
    understanding: 3, completed_at: '2026-10-23T04:00:00Z', ...overrides,
  };
}

test('7分と8分を15分に集計し、記録0件は0分になる', () => {
  assert.equal(totalLearningMinutes([record(), record({ actual_minutes: 8 })]), 15);
  assert.equal(totalLearningMinutes([]), 0);
});

test('入力の配列を変更せず、日時の新しい20件だけを表示する', () => {
  const input = Array.from({ length: 25 }, (_, i) => record({
    record_id: String(i), completed_at: new Date(Date.UTC(2026, 9, i + 1)).toISOString(),
  }));
  const displayed = latestLearningRecords(input);
  assert.equal(displayed.length, 20);
  assert.equal(displayed[0].record_id, '24');
  assert.equal(displayed[19].record_id, '5');
  assert.equal(input[0].record_id, '0');
  assert.equal(input.length, 25);
});

test('不正な日時は最後に並べ、日時不明と表示する', () => {
  const invalid = record({ completed_at: 'not-a-date' });
  const valid = record();
  assert.deepEqual(latestLearningRecords([invalid, valid]), [valid, invalid]);
  assert.equal(formatLogDate('not-a-date'), '日時不明');
  assert.equal(formatLogDate(null), '日時不明');
});

test('実行端末のタイムゾーンに依存せず日本時間で日付をまたぐ', () => {
  assert.equal(formatLogDate('2026-10-23T16:30:00Z'), '2026/10/24 01:30');
});

test('教科名と未知の教科ID、欠けた教科を区別する', () => {
  assert.equal(formatSubject('math'), '数学');
  assert.equal(formatSubject('japanese'), '国語');
  assert.equal(formatSubject('new-subject'), 'new-subject');
  assert.equal(formatSubject(null), '—');
});

test('理解度は進捗率に変換せず、1〜5の値と文言で表示する', () => {
  assert.equal(formatUnderstanding(3), '3/5：だいたいわかった');
  assert.equal(formatUnderstanding(5), '5/5：自分でできる');
  for (const value of [0, 6, 1.5, true, null, '3']) assert.equal(formatUnderstanding(value), '—');
});

test('不足・不正な学習時間を0に置き換えて合計を小さく見せない', () => {
  for (const value of [NaN, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(totalLearningMinutes([record(), record({ actual_minutes: value })]), null);
  }
  assert.equal(totalLearningMinutes([record({ actual_minutes: Number.MAX_SAFE_INTEGER }), record()]), null);
});
