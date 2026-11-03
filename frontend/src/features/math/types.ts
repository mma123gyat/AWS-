export interface MathStep {
  id: number
  grade: string
  unit: string
  category: string
}

export interface MathChoice {
  id: string
  text: string
  correct: boolean
}

export interface MathQuestion {
  id: string
  label: string
  prompt: string
  options: MathChoice[]
  hints: string[]
  explanation: string
}

export interface MathControl {
  id: string
  label: string
  min: number
  max: number
  step: number
  def: number
}

export interface MathAnimation {
  type: string
  params: Record<string, unknown>
  controls: MathControl[]
}

export interface MathLesson {
  step: number
  title: string
  narration: string[]
  animation: MathAnimation
  check: MathQuestion
  practice: MathQuestion[]
}
