import test from 'node:test'
import assert from 'node:assert/strict'
import { mathSteps } from '../src/features/math/catalog.ts'
import { mathLessons } from '../src/features/math/lessons.ts'
import { getMathStepsForTask, isCorrectChoice, mathMaterialUrl, parseMathStep, shuffleChoices } from '../src/features/math/mathMaterials.ts'
import { drawMathAnimation } from '../src/features/math/mathCanvas.js'

test('数学55単元と220問に重複しないID・一つの正解・解説がある', () => {
  assert.deepEqual(mathSteps.map(step => step.id), Array.from({ length: 55 }, (_, i) => i + 1))
  assert.deepEqual(mathLessons.map(lesson => lesson.step), mathSteps.map(step => step.id))
  const ids = new Set<string>()
  let count = 0
  for (const lesson of mathLessons) {
    assert.ok(lesson.title && lesson.narration.length)
    assert.equal(lesson.practice.length, 3)
    for (const question of [lesson.check, ...lesson.practice]) {
      assert.ok(question.prompt && question.explanation)
      assert.ok(question.options.length >= 2)
      assert.equal(question.options.filter(choice => choice.correct).length, 1)
      for (const id of [question.id, ...question.options.map(choice => choice.id)]) {
        assert.ok(!ids.has(id), id); ids.add(id)
      }
      count++
    }
  }
  assert.equal(count, 220)
})

test('並べ替えても選択肢IDと正誤は保持され、元データを変更しない', () => {
  const original = mathLessons[0].check.options
  const before = JSON.stringify(original)
  const shuffled = shuffleChoices(original, () => 0)
  assert.notEqual(shuffled[0].id, original[0].id)
  for (const option of shuffled) assert.equal(isCorrectChoice(shuffled, option.id), option.correct)
  assert.equal(isCorrectChoice(shuffled, 'unknown'), false)
  assert.equal(JSON.stringify(original), before)
  assert.notEqual(shuffled, original)
})

test('反比例を比例に誤対応させず、複合単元には両方を出す', () => {
  const lookup = (unit_name: string) => getMathStepsForTask({ subject_id: 'math', unit_name }).map(step => step.id)
  assert.deepEqual(lookup('比例'), [8])
  assert.deepEqual(lookup('反比例'), [9])
  assert.deepEqual(lookup('比例・反比例'), [8, 9])
  assert.deepEqual(lookup('一次方程式'), [6, 7])
  assert.deepEqual(lookup(' １次方程式の解き方 '), [6])
  for (const unit of ['走れメロス', '', '比例についての自由なタイトル', '__proto__', 'constructor']) assert.deepEqual(lookup(unit), [])
  assert.deepEqual(getMathStepsForTask({ subject_id: 'japanese', unit_name: '比例' }), [])
})

test('存在しない教材番号を受け付けず、タスクIDをURLへ安全に渡す', () => {
  for (const value of [undefined, '', '0', '56', '-1', '1.0', '1e1', '08', '../8', 'Infinity']) assert.equal(parseMathStep(value), null)
  assert.equal(parseMathStep('8'), 8); assert.equal(parseMathStep('55'), 55)
  const task = 'plan#1&step=999'
  const url = new URL(mathMaterialUrl(8, task), 'https://example.invalid')
  assert.equal(url.pathname, '/materials/math/8')
  assert.equal(url.searchParams.get('taskId'), task)
  assert.equal(url.searchParams.has('step'), false)
})

test('指摘された平方根・3辺の平方の問題文を修正している', () => {
  const root = mathLessons.find(lesson => lesson.step === 32)!
  assert.ok(root.narration[0].includes('-√a'))
  assert.ok(!root.practice[2].prompt.includes('根号を使わず'))
  const integer = mathLessons.find(lesson => lesson.step === 54)!
  assert.ok(!integer.practice[2].prompt.includes('3つの整数の2乗の和'))
})

test('55単元すべての図が、スライダーの初期値・下限・上限で不正な描画座標を渡さない', () => {
  const context = new Proxy({}, {
    get: () => (...args: unknown[]) => {
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), 'non-finite canvas coordinate')
    },
    set: () => true,
  })
  const canvas = { width: 380, height: 210, getContext: () => context } as unknown as HTMLCanvasElement
  for (const lesson of mathLessons) {
    for (const mode of ['def', 'min', 'max'] as const) {
      const controls = Object.fromEntries(lesson.animation.controls.map(control => [control.id, control[mode]]))
      assert.doesNotThrow(() => drawMathAnimation(canvas, lesson.animation, controls), `step ${lesson.step}, ${mode}`)
    }
  }
})
