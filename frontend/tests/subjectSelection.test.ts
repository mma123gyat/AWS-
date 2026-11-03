import assert from 'node:assert/strict'
import test from 'node:test'
import { planMatchesCondition, subjectName } from '../src/features/student/utils/subjectSelection.ts'
import type { DailyCondition } from '../src/api.ts'
import type { StudyPlanWithTasks } from '../src/types/student.ts'

const condition = { available_minutes: 15, subject_id: 'math' } as DailyCondition
const plan = { available_minutes: 15, subject_id: 'math' } as StudyPlanWithTasks

test('same minutes with another subject cannot show an old plan', () => {
  assert.equal(planMatchesCondition(plan, condition), true)
  assert.equal(planMatchesCondition({ ...plan, subject_id: 'japanese' }, condition), false)
  assert.equal(planMatchesCondition({ ...plan, available_minutes: 5 }, condition), false)
  assert.equal(planMatchesCondition(null, condition), false)
})

test('old conditions retain time-only matching', () => {
  const legacy = { available_minutes: 15 } as DailyCondition
  assert.equal(planMatchesCondition(plan, legacy), true)
  assert.equal(planMatchesCondition({ ...plan, available_minutes: 30 }, legacy), false)
})

test('subject labels handle unknown ids safely', () => {
  assert.equal(subjectName('math'), '算数・数学')
  assert.equal(subjectName('japanese'), '国語')
  assert.equal(subjectName('__proto__'), '__proto__')
})
