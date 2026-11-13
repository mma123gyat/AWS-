export type Subject = 'science' | 'japanese' | 'english' | 'social'

export interface VideoStep {
  id: number
  subject: Subject
  grade: string
  unit: string
  category: string
}

export type SummaryPart =
  | { kind: 'text'; text: string }
  | { kind: 'blank'; blankId: string }

export interface SummaryBlank {
  id: string
  answer: string
  choices: string[]
}

export interface Choice {
  id: string
  text: string
  correct: boolean
}

export interface PracticeQuestion {
  id: string
  label: string
  prompt: string
  options: Choice[]
  hints: string[]
  explanation: string
}

export interface VideoLesson {
  step: number
  subject: Subject
  title: string
  videoId: string
  summary: SummaryPart[]
  blanks: SummaryBlank[]
  practice: PracticeQuestion[]
}
