import {
  mockClassProgress,
  mockStudentProgress,
  mockStudents,
} from '../features/teacher/mock/teacherMockData';
import type {
  ApiCurriculumItem,
  ApiStudentProgressItem,
  ApiStudentSummary,
  PutClassProgressRequest,
  PutStudentProgressRequest,
} from '../types/api';
import type { AiParameters } from '../types/teacher';
import { apiGet, apiPut } from './client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function getStudents(): Promise<ApiStudentSummary[]> {
  if (USE_MOCK) return Promise.resolve(mockStudents);
  return apiGet<ApiStudentSummary[]>('/teacher/students');
}

export function getStudentProgress(studentId: string): Promise<ApiStudentProgressItem[]> {
  if (USE_MOCK) return Promise.resolve(mockStudentProgress[studentId] ?? []);
  return apiGet<ApiStudentProgressItem[]>(`/teacher/students/${studentId}/progress`);
}

export function putStudentProgress(
  studentId: string,
  payload: PutStudentProgressRequest,
): Promise<ApiStudentProgressItem> {
  if (USE_MOCK) {
    return Promise.resolve({
      student_progress_id: `${studentId}#${payload.subjectId}`,
      student_id: studentId,
      subject_id: payload.subjectId,
      unit_name: payload.unitName,
      understanding: payload.understanding,
      status: payload.status,
      updated_at: new Date().toISOString(),
    });
  }
  return apiPut<ApiStudentProgressItem>(`/teacher/students/${studentId}/progress`, payload);
}

export function getClassProgress(classId: string): Promise<ApiCurriculumItem[]> {
  if (USE_MOCK) return Promise.resolve(mockClassProgress);
  return apiGet<ApiCurriculumItem[]>(`/teacher/classes/${classId}/progress`);
}

export function putClassProgress(
  classId: string,
  payload: PutClassProgressRequest,
): Promise<ApiCurriculumItem> {
  if (USE_MOCK) {
    return Promise.resolve({
      curriculum_id: `${classId}#${payload.subjectId}`,
      class_id: classId,
      subject_id: payload.subjectId,
      unit_name: payload.unitName,
      textbook_page: payload.textbookPage,
      status: payload.status,
      updated_by: 'mock-teacher',
      updated_at: new Date().toISOString(),
    });
  }
  return apiPut<ApiCurriculumItem>(`/teacher/classes/${classId}/progress`, payload);
}

/**
 * AI提案パラメータの適用。対応する実エンドポイントがまだ存在しないため、
 * 実際のネットワーク呼び出しは行わず、ローカルでの受理のみを行うプレースホルダ。
 * 将来 Bedrock の generate_study_plan に渡す場合のマッピング案:
 *   - volume(1-5)       -> available_minutes のスケーリング係数
 *   - difficulty(1-5)   -> understanding の補正値
 *   - supportLevel(1-5) -> システムプロンプトの手厚さを切り替えるフラグ(要バックエンド新設)
 */
export function requestAiPlanAdjustment(
  studentId: string,
  params: AiParameters,
): Promise<{ studentId: string; params: AiParameters }> {
  return Promise.resolve({ studentId, params });
}
