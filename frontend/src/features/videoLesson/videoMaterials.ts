import { mathLessons } from '../math/lessons.ts'
import { videoSteps } from './catalog.ts'
import { videoLessons } from './lessons.ts'
import type { Choice, PracticeQuestion, Subject } from './types.ts'

// エンドレス演習の出題範囲は、動画教材の4教科に数学を加えた5教科。
export type PoolSubject = Subject | 'math'

const POOL_SUBJECTS: readonly PoolSubject[] = ['math', 'science', 'japanese', 'english', 'social']

export function isPoolSubject(value: string | undefined): value is PoolSubject {
  return !!value && POOL_SUBJECTS.includes(value as PoolSubject)
}

export function parseVideoStep(subject: Subject, value: string | undefined): number | null {
  if (!value || !/^[1-9]\d?$/.test(value)) return null
  const number = Number(value)
  return videoSteps.some(step => step.subject === subject && step.id === number) ? number : null
}

export function videoMaterialUrl(subject: Subject, step: number): string {
  return `/materials/${subject}/${step}`
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function isCorrectChoice(choices: readonly Choice[], selectedId: string): boolean {
  return choices.find(choice => choice.id === selectedId)?.correct === true
}

export function checkBlankAnswer(answer: string, input: string): boolean {
  const normalize = (value: string) => value.normalize('NFKC').trim()
  return normalize(answer) === normalize(input)
}

export function practiceQuestionsForSubject(subject: PoolSubject): PracticeQuestion[] {
  if (subject === 'math') return mathLessons.flatMap(lesson => [lesson.check, ...lesson.practice])
  return videoLessons.filter(lesson => lesson.subject === subject).flatMap(lesson => lesson.practice)
}

export function pickRandomPracticeQuestion(subject: PoolSubject, excludeId?: string): PracticeQuestion | null {
  const pool = practiceQuestionsForSubject(subject)
  const candidates = pool.length > 1 ? pool.filter(question => question.id !== excludeId) : pool
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}
