import { toProgressSeries } from '../api/mappers/progressMapper';
import { getClassProgress, getStudentProgress } from '../api/teacherApi';
import type { ApiCurriculumItem, ApiStudentProgressItem } from '../types/api';
import type { ProgressData } from '../types/teacher';
import { useFetch } from './useFetch';

export interface StudentProgressData {
  progressSeries: ProgressData[];
  curriculumItems: ApiCurriculumItem[];
  studentProgressItems: ApiStudentProgressItem[];
}

export function useStudentProgress(studentId: string, classId: string) {
  return useFetch<StudentProgressData>(async () => {
    const [curriculumItems, studentProgressItems] = await Promise.all([
      getClassProgress(classId),
      getStudentProgress(studentId),
    ]);
    return {
      progressSeries: toProgressSeries(curriculumItems, studentProgressItems),
      curriculumItems,
      studentProgressItems,
    };
  }, [studentId, classId]);
}
