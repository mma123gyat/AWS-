import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApiSupportReport } from '../src/types/api';
import { messageLength, readSupportReport, reasonLabel, statusLabel, supportReportDates, understandingLabel } from '../src/features/support/utils/supportReport.ts';

function data(): ApiSupportReport {
  return { studentId: 'student-1', studentName: 'テスト生徒', recentStudyMinutes: 15, recentRecordCount: 2,
    subjectProgresses: [{ subjectId: 'math', subjectName: '数学', understanding: 2, status: 'IN_PROGRESS' }],
    supportNeededSubjects: [{ subjectId: 'math', subjectName: '数学', reasons: ['理解度が低い教科'] }],
    canSendMessage: true, attendance: null, attendanceNote: '出席情報はまだ連携されていません。' };
}
test('実際の0件・0分と共有停止のnullを区別する', () => {
  const empty = readSupportReport({ ...data(), recentStudyMinutes: 0, recentRecordCount: 0, subjectProgresses: [], supportNeededSubjects: [] });
  const hidden = readSupportReport({ ...data(), recentStudyMinutes: null, recentRecordCount: null, subjectProgresses: null, supportNeededSubjects: null, canSendMessage: false });
  assert.equal(empty.recentStudyMinutes, 0); assert.equal(hidden.recentStudyMinutes, null);
  assert.deepEqual(empty.subjectProgresses, []); assert.equal(hidden.subjectProgresses, null);
});
test('まとめ・教科・メッセージの共有は独立して扱う', () => {
  assert.equal(readSupportReport({ ...data(), recentStudyMinutes: null, recentRecordCount: null }).subjectProgresses?.length, 1);
  assert.equal(readSupportReport({ ...data(), subjectProgresses: null, supportNeededSubjects: null, canSendMessage: false }).recentStudyMinutes, 15);
});
test('一部だけ欠けた応答・不正な集計を0や共有停止に置き換えない', () => {
  for (const bad of [null, [], {}, { ...data(), recentStudyMinutes: null }, { ...data(), recentRecordCount: undefined },
    { ...data(), recentStudyMinutes: -1 }, { ...data(), recentStudyMinutes: 1.5 }, { ...data(), recentRecordCount: true },
    { ...data(), recentRecordCount: 0 }, { ...data(), recentStudyMinutes: Number.MAX_SAFE_INTEGER + 1 },
    { ...data(), canSendMessage: 'false' }, { ...data(), subjectProgresses: null }, { ...data(), supportNeededSubjects: null },
    { ...data(), studentId: '' }, { ...data(), attendance: [] },
  ]) assert.throws(() => readSupportReport(bad));
});
test('理解度の未登録はnullのまま保ち、1〜5以外や不正な進行状態を拒否する', () => {
  const subject = data().subjectProgresses![0];
  assert.equal(readSupportReport({ ...data(), subjectProgresses: [{ ...subject, understanding: null, status: null }] }).subjectProgresses?.[0].understanding, null);
  for (const bad of [0, 6, true, '2', 2.5, undefined]) assert.throws(() => readSupportReport({ ...data(), subjectProgresses: [{ ...subject, understanding: bad }] }));
  assert.throws(() => readSupportReport({ ...data(), subjectProgresses: [{ ...subject, status: 'UNKNOWN' }] }));
});
test('教科の重複や別教科の確認事項、不正な理由を拒否する', () => {
  const subject = data().subjectProgresses![0], needed = data().supportNeededSubjects![0];
  for (const bad of [{ ...data(), subjectProgresses: [subject, subject] }, { ...data(), supportNeededSubjects: [needed, needed] },
    { ...data(), supportNeededSubjects: [{ ...needed, subjectId: 'other' }] }, { ...data(), supportNeededSubjects: [{ ...needed, reasons: [] }] },
    { ...data(), supportNeededSubjects: [{ ...needed, reasons: [false] }] },
  ]) assert.throws(() => readSupportReport(bad));
});
test('受け取った教科名・理由・理解度を変更せず、応答と独立したデータを返す', () => {
  const input = data(); const copy = readSupportReport(input);
  assert.deepEqual(copy, input); assert.notEqual(copy.subjectProgresses, input.subjectProgresses);
  copy.supportNeededSubjects![0].reasons.push('追加'); assert.equal(input.supportNeededSubjects![0].reasons.length, 1);
});
test('理解度を百分率に変換せず1〜5で表示し、未登録と0を混同しない', () => {
  assert.equal(understandingLabel(4), '4 / 5'); assert.equal(understandingLabel(null), '未登録');
  assert.deepEqual(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', null].map(value => statusLabel(value as never)), ['未着手', '進行中', '完了', '未登録']);
});
test('確認事項の表現は直近7日間の記録と未登録を区別し、診断や出欠を推測しない', () => {
  assert.equal(reasonLabel('理解度が低い教科', 2), '理解度1・2の記録があります');
  assert.equal(reasonLabel('理解度が低い教科', null), '理解度の記録を確認してください');
  assert.equal(reasonLabel('最近学習記録が少ない教科', 4), '直近7日間に、この教科の学習記録がありません');
  assert.equal(reasonLabel('今後追加される理由', 4), '今後追加される理由');
});
test('対象期間は端末のタイムゾーンに依存せず、日本時間の今日を含む7日間', () => {
  assert.deepEqual(supportReportDates('2026-10-24T16:20:00Z'), { fetched: '2026/10/25 01:20', period: '2026/10/19〜2026/10/25' });
  assert.deepEqual(supportReportDates('2026-01-02T00:00:00+09:00'), { fetched: '2026/01/02 00:00', period: '2025/12/27〜2026/01/02' });
});
test('メッセージは前後の空白を除き、Pythonと同じUnicodeコードポイントで1000文字を数える', () => {
  assert.equal(messageLength(' \n　 '), 0); assert.equal(messageLength(' こんにちは\n次の行 '), 9);
  assert.equal(messageLength('😀'.repeat(1000)), 1000); assert.equal(messageLength('あ'.repeat(1001)), 1001);
});
