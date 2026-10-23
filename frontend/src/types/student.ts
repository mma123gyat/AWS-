import type {
  ApiCurriculumItem,
  ApiStudentProgressItem,
  CurriculumStatus,
} from './api'

import type { AvailableMinutes, DailyCondition } from '../api'

export type StudyTaskStatus = CurriculumStatus

export type StudyPlanStatus = 'COMPLETED' | 'GENERATING' | 'FAILED'

export type Understanding = 1 | 2 | 3 | 4 | 5

export interface StudyRecord {
  record_id: string
  student_id: string
  sort_key: string
  task_id: string
  subject_id: string
  unit_name: string
  actual_minutes: number
  understanding: Understanding
  completed_at: string
}

export interface SaveStudyRecordInput {
  taskId: string
  actualMinutes: number
  understanding: Understanding
}

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
  completion_record?: StudyRecord
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
