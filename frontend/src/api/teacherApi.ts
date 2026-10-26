import {
  mockClassProgress,
  mockTeacherProfile,
  mockStudentProgress,
  mockStudents,
  mockTeacherLearningLogs,
  getMockLearningHistory,
} from '../features/teacher/mock/teacherMockData';
import type {
  ApiCurriculumItem,
  ApiStudentProgressItem,
  ApiStudentSummary,
  ApiTeacherLearningLogs,
  ApiTeacherProfile,
  PutClassProgressRequest,
  PutStudentProgressRequest,
} from '../types/api';
import type { LearningHistory } from '../types/learningHistory';
import { validateLearningHistory } from '../features/teacher/utils/learningHistory';
import type { AiParameterSettings, AiParameters } from '../types/teacher';
import { ApiError, apiGet, apiPut } from './client';
import { readTeacherProfile } from '../features/teacher/utils/teacherProfile';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function getTeacherProfile(): Promise<ApiTeacherProfile> {
  return readTeacherProfile(USE_MOCK ? mockTeacherProfile : await apiGet<unknown>('/teacher/me'));
}

export function getStudents(): Promise<ApiStudentSummary[]> {
  if (USE_MOCK) return Promise.resolve(mockStudents);
  return apiGet<ApiStudentSummary[]>('/teacher/students');
}

export function getTeacherLearningLogs(studentId: string): Promise<ApiTeacherLearningLogs> {
  if (USE_MOCK) {
    const logs = mockTeacherLearningLogs[studentId];
    return logs
      ? Promise.resolve(logs)
      : Promise.reject(new ApiError('NOT_FOUND', '生徒が見つかりませんでした。', 404));
  }
  return apiGet<ApiTeacherLearningLogs>(`/teacher/students/${encodeURIComponent(studentId)}`);
}

export async function getTeacherLearningHistory(studentId: string): Promise<LearningHistory> {
  if (USE_MOCK) {
    const history = getMockLearningHistory(studentId);
    if (!history) throw new ApiError('NOT_FOUND', '生徒が見つかりませんでした。', 404);
    return validateLearningHistory(history, studentId);
  }
  const response = await apiGet<unknown>(`/teacher/students/${encodeURIComponent(studentId)}/learning-history`);
  return validateLearningHistory(response, studentId);
}

export function getStudentProgress(studentId: string): Promise<ApiStudentProgressItem[]> {
  if (USE_MOCK) return mockStudents.some(student => student.studentId === studentId)
    ? Promise.resolve(structuredClone(mockStudentProgress[studentId] ?? []))
    : Promise.reject(new ApiError('NOT_FOUND', '生徒が見つかりませんでした。', 404));
  return apiGet<ApiStudentProgressItem[]>(`/teacher/students/${encodeURIComponent(studentId)}/progress`);
}

export function putStudentProgress(
  studentId: string,
  payload: PutStudentProgressRequest,
): Promise<ApiStudentProgressItem> {
  if (USE_MOCK) {
    if (!mockStudents.some(student => student.studentId === studentId)) return Promise.reject(new ApiError('NOT_FOUND', '生徒が見つかりませんでした。', 404));
    const item: ApiStudentProgressItem = {
      student_progress_id: `${studentId}#${payload.subjectId}`,
      student_id: studentId,
      subject_id: payload.subjectId,
      unit_name: payload.unitName,
      understanding: payload.understanding,
      status: payload.status,
      updated_at: new Date().toISOString(),
    };
    mockStudentProgress[studentId] = [...(mockStudentProgress[studentId] ?? []).filter(row => row.subject_id !== item.subject_id), item];
    return Promise.resolve(structuredClone(item));
  }
  return apiPut<ApiStudentProgressItem>(`/teacher/students/${encodeURIComponent(studentId)}/progress`, payload);
}

export function getClassProgress(classId: string): Promise<ApiCurriculumItem[]> {
  if (USE_MOCK) return classId === mockTeacherProfile.classId ? Promise.resolve(structuredClone(mockClassProgress)) : Promise.reject(new ApiError('FORBIDDEN', '担当クラス以外の進度は確認できません。', 403));
  return apiGet<ApiCurriculumItem[]>(`/teacher/classes/${encodeURIComponent(classId)}/progress`);
}

export function putClassProgress(
  classId: string,
  payload: PutClassProgressRequest,
): Promise<ApiCurriculumItem> {
  if (USE_MOCK) {
    if (classId !== mockTeacherProfile.classId) return Promise.reject(new ApiError('FORBIDDEN', '担当クラス以外の進度は編集できません。', 403));
    const item: ApiCurriculumItem = {
      curriculum_id: `${classId}#${payload.subjectId}`,
      class_id: classId,
      subject_id: payload.subjectId,
      unit_name: payload.unitName,
      textbook_page: payload.textbookPage,
      status: payload.status,
      updated_by: 'mock-teacher',
      updated_at: new Date().toISOString(),
    };
    const index = mockClassProgress.findIndex(row => row.subject_id === item.subject_id);
    if (index < 0) mockClassProgress.push(item); else mockClassProgress[index] = item;
    return Promise.resolve(structuredClone(item));
  }
  return apiPut<ApiCurriculumItem>(`/teacher/classes/${encodeURIComponent(classId)}/progress`, payload);
}

// Mock changes are local to this browser session, never a fallback for real API errors.
const mockAiSettings = new Map<string, AiParameterSettings>();

export function getAiPlanParameters(studentId: string): Promise<AiParameterSettings> {
  if (USE_MOCK) {
    if (!mockStudents.some(student => student.studentId === studentId)) {
      return Promise.reject(new ApiError('NOT_FOUND', '生徒が見つかりませんでした。', 404));
    }
    return Promise.resolve(structuredClone(mockAiSettings.get(studentId) ?? {
      studentId, params: { difficulty: 3, volume: 3, supportLevel: 3 }, updatedAt: null,
    }));
  }
  return apiGet<AiParameterSettings>(`/teacher/students/${encodeURIComponent(studentId)}/ai-parameters`);
}

export function requestAiPlanAdjustment(
  studentId: string,
  params: AiParameters,
): Promise<AiParameterSettings> {
  if (USE_MOCK) {
    if (!mockStudents.some(student => student.studentId === studentId)) {
      return Promise.reject(new ApiError('NOT_FOUND', '生徒が見つかりませんでした。', 404));
    }
    const settings = { studentId, params: { ...params }, updatedAt: new Date().toISOString() };
    mockAiSettings.set(studentId, settings);
    return Promise.resolve(structuredClone(settings));
  }
  return apiPut<AiParameterSettings>(`/teacher/students/${encodeURIComponent(studentId)}/ai-parameters`, params);
}
