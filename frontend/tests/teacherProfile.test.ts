import test from 'node:test';
import assert from 'node:assert/strict';
import { readTeacherProfile } from '../src/features/teacher/utils/teacherProfile.ts';

test('サーバーが返した担当クラスを使い、1組へ置き換えない', () => {
  const value = { classId: 'class-2', className: '2年2組', extra: 'not required' };
  const before = structuredClone(value);
  assert.deepEqual(readTeacherProfile(value), { classId: 'class-2', className: '2年2組' });
  assert.deepEqual(value, before);
});
test('欠けた・不正な担当クラスはエラーにし、固定IDへフォールバックしない', () => {
  for (const value of [null, [], {}, { classId: null, className: null }, { classId: '', className: null },
    { classId: '  ', className: null }, { classId: ' class-2 ', className: null }, { classId: 2, className: null },
    { classId: 'class-2' }, { classId: 'class-2', className: {} },
  ]) assert.throws(() => readTeacherProfile(value));
});
test('クラス名が未登録でも担当クラスIDを維持する', () => {
  assert.deepEqual(readTeacherProfile({ classId: 'class-2', className: null }), { classId: 'class-2', className: null });
  assert.deepEqual(readTeacherProfile({ classId: 'class-2', className: '  ' }), { classId: 'class-2', className: null });
});
test('表示名だけ前後の空白を除き、担当クラスの識別子を書き換えない', () => {
  assert.deepEqual(readTeacherProfile({ classId: 'school/class-2', className: '　2年2組　' }), { classId: 'school/class-2', className: '2年2組' });
});
