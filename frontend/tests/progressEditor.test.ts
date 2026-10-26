import test from 'node:test';
import assert from 'node:assert/strict';
import { currentProgress, emptyProgress, readProgressItems } from '../src/features/teacher/utils/progressEditor.ts';

const school = { class_id: 'c1', subject_id: 'math', unit_name: '比例', textbook_page: 'p.42', status: 'COMPLETED' };
const student = { student_id: 's1', subject_id: 'math', unit_name: '反比例', understanding: 4, status: 'IN_PROGRESS' };
test('学校の単元・ページ・状態を教科別に保持する', () => {
  const result = readProgressItems([school, { ...school, subject_id: 'japanese', unit_name: '走れメロス', textbook_page: '' }], 'school', 'c1');
  assert.equal(result.math.unitName, '比例'); assert.equal(result.math.textbookPage, 'p.42');
  assert.equal(result.math.status, 'COMPLETED'); assert.equal(result.japanese.unitName, '走れメロス');
});
test('生徒の理解度は保存値の1〜5を使い、初期値3で置き換えない', () => {
  assert.equal(readProgressItems([student], 'student', 's1').math.understanding, 4);
  assert.equal(readProgressItems([{ ...student, understanding: 1 }], 'student', 's1').math.understanding, 1);
});
test('未登録の正常な空配列と、取得失敗・不正な応答を区別する', () => {
  assert.deepEqual(Object.keys(readProgressItems([], 'student', 's1')), []);
  assert.equal(emptyProgress('science').unitName, '');
  for (const bad of [null, {}, false, [null], [[]]]) assert.throws(() => readProgressItems(bad, 'school', 'c1'));
});
test('別クラス・別生徒や重複教科の応答を編集に使わない', () => {
  assert.throws(() => readProgressItems([school], 'school', 'c2'));
  assert.throws(() => readProgressItems([student], 'student', 's2'));
  assert.throws(() => readProgressItems([student, student], 'student', 's1'));
});
test('欠けた値や不正な値を初期値に置き換えて保存できる状態にしない', () => {
  for (const bad of [null, true, '4', 0, 6, 1.5]) assert.throws(() => readProgressItems([{ ...student, understanding: bad }], 'student', 's1'));
  for (const bad of [null, {}, ['COMPLETED'], 'DONE']) assert.throws(() => readProgressItems([{ ...school, status: bad }], 'school', 'c1'));
  for (const bad of [null, {}, '', '　', 'あ'.repeat(201)]) assert.throws(() => readProgressItems([{ ...school, unit_name: bad }], 'school', 'c1'));
  for (const bad of [null, 42, '頁'.repeat(101)]) assert.throws(() => readProgressItems([{ ...school, textbook_page: bad }], 'school', 'c1'));
});
test('入力データを変更せず、未知の教科やUnicode文字も保持する', () => {
  const input = { ...school, subject_id: '__proto__', unit_name: '😀'.repeat(200) };
  const result = readProgressItems([input], 'school', 'c1');
  assert.equal(result.__proto__.unitName, input.unit_name);
  result.__proto__.unitName = '変更'; assert.equal(input.unit_name, '😀'.repeat(200));
});

test('未登録の教科IDがObjectの継承プロパティと同じでも、正しい初期値を使う', () => {
  assert.equal(currentProgress({}, {}, '__proto__').unitName, '');
  assert.equal(currentProgress({}, {}, 'constructor').understanding, 3);
});
