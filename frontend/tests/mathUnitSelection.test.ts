import test from 'node:test';
import assert from 'node:assert/strict';
import { mathSteps } from '../src/features/math/catalog.ts';
import { getMathStepsForTask } from '../src/features/math/mathMaterials.ts';
import { currentProgress, emptyProgress, readProgressItems } from '../src/features/teacher/utils/progressEditor.ts';

test('every selectable math unit maps to exactly its own material', () => {
  assert.equal(mathSteps.length, 55);
  assert.equal(new Set(mathSteps.map(step => step.unit)).size, 55);
  assert.deepEqual([...new Set(mathSteps.map(step => step.grade))], ['中1', '中2', '中3', '中3(入試対策)']);
  for (const step of mathSteps) {
    assert.deepEqual(getMathStepsForTask({ subject_id: 'math', unit_name: step.unit }).map(result => result.id), [step.id]);
  }
});

test('existing aliases and unsupported units stay unchanged when editing other fields', () => {
  for (const unit of ['比例・反比例', 'test', '数学独自単元😀']) {
    const saved = readProgressItems([{ student_id: 's1', subject_id: 'math', unit_name: unit, understanding: 2, status: 'IN_PROGRESS' }], 'student', 's1');
    const next = { ...currentProgress(saved, {}, 'math'), understanding: 4 };
    assert.equal(next.unitName, unit);
    assert.equal(saved.math.unitName, unit);
  }
  assert.deepEqual(getMathStepsForTask({ subject_id: 'math', unit_name: '比例・反比例' }).map(step => step.id), [8, 9]);
  assert.deepEqual(getMathStepsForTask({ subject_id: 'math', unit_name: 'test' }), []);
});

test('a chosen math unit survives subject switches without changing another draft', () => {
  const math = { ...emptyProgress('math'), unitName: mathSteps[0].unit, understanding: 2 };
  const japanese = { ...emptyProgress('japanese'), unitName: '走れメロス' };
  const drafts = { math, japanese };
  assert.equal(currentProgress({}, drafts, 'japanese').unitName, '走れメロス');
  assert.equal(currentProgress({}, drafts, 'math').unitName, '正負の数の加法・減法');
  assert.equal(currentProgress({}, drafts, 'math').understanding, 2);
  assert.equal(emptyProgress('math').unitName, '');
});
