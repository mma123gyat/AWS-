import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApiMessageItem, ApiParentDashboard } from '../src/types/api';
import { badgeCopy, formatParentDate, newestMessages, readParentDashboard, senderLabel } from '../src/features/parent/utils/parentDashboard.ts';

function message(id: string, date = '2026-10-23T16:00:00Z'): ApiMessageItem {
  return { message_id: id, student_id: 'student-1', sort_key: `${date}#${id}`, sender_user_id: 'support-1', sender_role: 'SUPPORT', body: '見守りのメッセージ\n次の行', created_at: date };
}
function data(): ApiParentDashboard {
  return { studentName: 'テスト生徒', weeklyStudyMinutes: 15, studiedDays: 1, recordCount: 2,
    badges: [{ id: 'streak_3', label: '3日継続', earned: false }], messages: [message('one')] };
}

test('共有停止のnullと、記録0件の実際の0を区別する', () => {
  const privateData = { ...data(), weeklyStudyMinutes: null, studiedDays: null, recordCount: null, badges: null, messages: null };
  assert.deepEqual(readParentDashboard(privateData), privateData);
  const empty = { ...data(), weeklyStudyMinutes: 0, studiedDays: 0, recordCount: 0, messages: [] };
  assert.equal(readParentDashboard(empty).recordCount, 0);
  assert.notEqual(readParentDashboard(empty).recordCount, readParentDashboard(privateData).recordCount);
});
test('学習のまとめとメッセージの共有を独立して扱う', () => {
  assert.equal(readParentDashboard({ ...data(), messages: null }).weeklyStudyMinutes, 15);
  const onlyMessages = { ...data(), weeklyStudyMinutes: null, studiedDays: null, recordCount: null, badges: null };
  assert.equal(readParentDashboard(onlyMessages).messages?.length, 1);
});
test('一部だけ欠けた集計や不正な件数を、0や共有停止として表示しない', () => {
  for (const bad of [null, [], {}, { ...data(), studentName: 42 }, { ...data(), weeklyStudyMinutes: null },
    { ...data(), studiedDays: 8 }, { ...data(), studiedDays: 3 }, { ...data(), recordCount: true },
    { ...data(), weeklyStudyMinutes: -1 }, { ...data(), weeklyStudyMinutes: 1.5 },
    { ...data(), weeklyStudyMinutes: Number.MAX_SAFE_INTEGER + 1 }, { ...data(), recordCount: 0 },
  ]) assert.throws(() => readParentDashboard(bad));
});
test('集計が共有停止なのにスタンプを含む矛盾した応答を拒否する', () => {
  assert.throws(() => readParentDashboard({ ...data(), weeklyStudyMinutes: null, studiedDays: null, recordCount: null }));
  assert.throws(() => readParentDashboard({ ...data(), badges: null }));
});
test('スタンプやメッセージの重複・不正な値は受け付けない', () => {
  for (const bad of [{ ...data(), badges: [{ id: 'x', label: 'test', earned: 'false' }] },
    { ...data(), badges: [data().badges![0], data().badges![0]] },
    { ...data(), messages: [message('one'), message('one')] },
    { ...data(), messages: [{ ...message('one'), body: 1 }] }, { ...data(), messages: undefined },
  ]) assert.throws(() => readParentDashboard(bad));
});
test('受け取った本文・改行・獲得フラグを変えず、独立したデータを返す', () => {
  const input = data(), copy = readParentDashboard(input);
  assert.deepEqual(copy, input);
  assert.notEqual(copy, input);
  assert.notEqual(copy.messages, input.messages);
  assert.equal(copy.messages?.[0].body, '見守りのメッセージ\n次の行');
  assert.equal(copy.badges?.[0].earned, false);
});
test('メッセージの日時は端末のタイムゾーンに依存せず、日本時間で日付をまたぐ', () => {
  assert.equal(formatParentDate('2026-10-23T16:00:00Z'), '2026/10/24 01:00');
  assert.equal(formatParentDate('2026-10-24T01:00:00+09:00'), '2026/10/24 01:00');
  for (const bad of [null, undefined, 'invalid', '2026-02-30T00:00:00Z', '2026-10-24T01:00:00']) assert.equal(formatParentDate(bad), '日時不明');
});
test('新しいメッセージから並べ、日時不明は最後に残し、元の配列を変更しない', () => {
  const input = [message('unknown', 'bad'), message('old', '2026-10-20T00:00:00Z'), message('new')];
  const before = structuredClone(input);
  assert.deepEqual(newestMessages(input).map(item => item.message_id), ['new', 'old', 'unknown']);
  assert.deepEqual(input, before);
});
test('スタンプを連続日数や理解度の上昇と誤って説明せず、獲得条件はAPIに任せる', () => {
  const three = badgeCopy({ id: 'streak_3', label: '3日継続', earned: true });
  assert.equal(three.label, '3日学習できた');
  assert.match(three.description, /3日以上/);
  assert.doesNotMatch(three.label, /連続|継続/);
  const understanding = badgeCopy({ id: 'understanding_up', label: '理解度アップ', earned: false });
  assert.doesNotMatch(understanding.label, /アップ|上昇/);
  assert.match(understanding.description, /4・5/);
  assert.equal(badgeCopy({ id: 'future', label: '新しいスタンプ', earned: false }).label, '新しいスタンプ');
});
test('送信者の表示名は既存ロールを保ち、未知の内部ロール名は表示しない', () => {
  assert.equal(senderLabel('SUPPORT'), '支援担当者');
  assert.equal(senderLabel('TEACHER'), '先生');
  assert.equal(senderLabel('INTERNAL_FUTURE_ROLE'), '送信者');
});
