import { apiGet, apiPost } from './client'
import type {
  StudentDashboard,
  GenerateStudyPlanResult,
  SaveStudyRecordInput,
  StudyRecord,
} from '../types/student'

export function getStudentDashboard(): Promise<StudentDashboard> {
  return apiGet<StudentDashboard>('/students/me/dashboard')
}

export function generateTodayStudyPlan(): Promise<GenerateStudyPlanResult> {
  return apiPost<GenerateStudyPlanResult>('/students/me/study-plan', {})
}

export function saveStudyRecord(input: SaveStudyRecordInput): Promise<StudyRecord> {
  return apiPost<StudyRecord>('/study-records', input)
}
