import type {
  ApiCurriculumItem,
  ApiStudentProgressItem,
  CurriculumStatus,
} from './api'

import type { AvailableMinutes, DailyCondition } from '../api'

export type StudyTaskStatus = CurriculumStatus

export type StudyPlanStatus = 'COMPLETED' | 'GENERATING' | 'FAILED'

export interface StudyTask {
  task_id: string
  plan_id: string
  student_id: string
  subject_id: string
  unit_name: string
  task_order: number
  title: string
  description: string
  planned_minutes: number
  status: StudyTaskStatus
}

export interface StudyPlanWithTasks {
  student_id: string
  plan_date: string
  plan_id: string
  status: StudyPlanStatus
  owner_id: string
  available_minutes: AvailableMinutes
  subject_id: string
  title: string
  reason: string
  generator: 'BEDROCK' | 'RULE'
  model_id: string
  prompt_version: string
  created_at: string
  updated_at: string
  tasks: StudyTask[]
}

export interface StudentDashboard {
  schoolCurrentPosition: ApiCurriculumItem | null
  myCurrentPosition: ApiStudentProgressItem | null
  todayCondition: DailyCondition | null
  todayPlan: StudyPlanWithTasks | null
}

export interface GenerateStudyPlanResult {
  isRestDay: boolean
  plan: StudyPlanWithTasks | null
}
