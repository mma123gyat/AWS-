import { mathSteps } from './catalog.ts'
import type { MathChoice } from './types.ts'

// Explicit aliases only: in particular, 反比例 must never match 比例 by substring.
const UNIT_ALIASES: Record<string, number[]> = {
  '比例・反比例': [8, 9], '比例と反比例': [8, 9], '比例': [8], '反比例': [9],
  '正負の数': [1, 2], '文字式': [3, 4, 5], '文字と式': [3, 4, 5],
  '1次方程式': [6, 7], '方程式': [6, 7], '平面図形': [10], '空間図形': [11, 12],
  '連立方程式': [17, 18], '1次関数': [19, 20, 21, 22],
  '平行線と角': [23], '合同': [25], '平行四辺形': [26], '確率': [27],
  '展開': [28, 29], '因数分解': [30, 31], '平方根': [32, 33], '2次方程式': [34, 35],
  '2次関数': [36, 37, 38], '関数y=ax²': [36, 37, 38],
  '相似': [39, 40, 41, 42], '円周角': [43], '三平方の定理': [45, 46, 47],
  '標本調査': [48], '素因数分解': [49],
}

function normalizeUnit(value: string): string {
  return value.normalize('NFKC').replaceAll('一次', '1次').replaceAll('二次', '2次').replace(/\s+/g, '')
}

export function getMathStepsForTask(task: { subject_id: string; unit_name: string }) {
  if (task.subject_id !== 'math') return []
  const unit = normalizeUnit(task.unit_name)
  const exact = mathSteps.find(step => normalizeUnit(step.unit) === unit)
  if (exact) return [exact]
  const alias = Object.entries(UNIT_ALIASES).find(([name]) => normalizeUnit(name) === unit)
  return alias ? mathSteps.filter(step => alias[1].includes(step.id)) : []
}

export function parseMathStep(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d?$/.test(value)) return null
  const number = Number(value)
  return mathSteps.some(step => step.id === number) ? number : null
}

export function mathMaterialUrl(step: number, taskId?: string): string {
  const base = `/materials/math/${step}`
  return taskId ? `${base}?taskId=${encodeURIComponent(taskId)}` : base
}

export function shuffleChoices(choices: readonly MathChoice[], random: () => number = Math.random): MathChoice[] {
  const result = [...choices]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function isCorrectChoice(choices: readonly MathChoice[], selectedId: string): boolean {
  return choices.find(choice => choice.id === selectedId)?.correct === true
}
