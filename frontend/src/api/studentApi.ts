import { apiGet, apiPost } from './client'
import type { StudentDashboard, GenerateStudyPlanResult } from '../types/student'

export function getStudentDashboard(): Promise<StudentDashboard> {
  return apiGet<StudentDashboard>('/students/me/dashboard')
}

export function generateTodayStudyPlan(): Promise<GenerateStudyPlanResult> {
  return apiPost<GenerateStudyPlanResult>('/students/me/study-plan', {})
}
