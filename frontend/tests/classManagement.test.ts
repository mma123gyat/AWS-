import test from 'node:test';
import assert from 'node:assert/strict';
import { readClassData } from '../src/features/admin/classManagement.ts';
const data = { classes: [{ class_id: 'c', class_name: '1組', grade: '1', school_year: '2026', version: 0 }], users: [{ user_id: 'u', name: '生徒', email: '', role: 'STUDENT', class_id: 'c', version: 0 }], audits: [] };
test('既存クラスのバージョン0と未設定の所属を扱える', () => {
  assert.equal(readClassData(data).users[0].version, 0);
  assert.equal(readClassData({ ...data, users: [{ ...data.users[0], class_id: null }] }).users[0].class_id, null);
});
test('管理者・保護者を所属変更の候補に混ぜない', () => {
  for (const role of ['ADMIN', 'PARENT', 'SUPPORT']) assert.throws(() => readClassData({ ...data, users: [{ ...data.users[0], role }] }));
});
test('不正なバージョンや日時の履歴を表示しない', () => {
  for (const version of [-1, true, 0.5, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => readClassData({ ...data, users: [{ ...data.users[0], version }] }));
  assert.throws(() => readClassData({ ...data, audits: [{ created_at: 'invalid' }] }));
});
