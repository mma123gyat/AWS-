import test from 'node:test';
import assert from 'node:assert/strict';
import { filterStudents } from '../src/features/teacher/utils/studentFilters.ts';
import type { Student } from '../src/types/teacher.ts';

const students: Student[] = [
  { id: 'a', name: '山田 花子', understanding: 4, lastLogin: '今日', status: 'NORMAL' },
  { id: 'b', name: '佐藤 太郎', understanding: 2, lastLogin: '今日', status: 'WARNING' },
  { id: 'c', name: 'ＡＢＣさん', understanding: null, lastLogin: '記録なし', status: 'UNSUBMITTED' },
];
test('名前検索と状況の条件を同時に適用し、担当外のデータを補わない', () => {
  assert.deepEqual(filterStudents(students, '佐藤', 'WARNING').map(s => s.id), ['b']);
  assert.deepEqual(filterStudents(students, '佐藤', 'NORMAL'), []);
  assert.deepEqual(filterStudents(students, '担当外の名前', 'ALL'), []);
});
test('前後の空白・英字の大小・全角半角を吸収し、記号は文字として検索する', () => {
  assert.deepEqual(filterStudents(students, ' abc ', 'ALL').map(s => s.id), ['c']);
  assert.deepEqual(filterStudents(students, '.*', 'ALL'), []);
});
test('空の検索は全員を元の順に返し、配列や記録値を変更しない', () => {
  const before = structuredClone(students);
  const all = filterStudents(students, '', 'ALL');
  assert.deepEqual(all, students);
  assert.notEqual(all, students);
  assert.deepEqual(students, before);
  assert.deepEqual(filterStudents([], '', 'ALL'), []);
});
