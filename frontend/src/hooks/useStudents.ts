import { toStudent } from '../api/mappers/studentMapper';
import { getStudents } from '../api/teacherApi';
import type { Student } from '../types/teacher';
import { useFetch } from './useFetch';

export function useStudents() {
  return useFetch<Student[]>(
    () => getStudents().then((list) => list.map(toStudent)),
    [],
  );
}
