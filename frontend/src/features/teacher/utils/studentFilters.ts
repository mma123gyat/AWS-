import type { Student } from '../../../types/teacher';
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja-JP').trim();

/** Filter only the assigned list already returned by the API. Never mutate it. */
export function filterStudents(students: Student[], query: string, status: 'ALL' | Student['status']): Student[] {
  const needle = normalize(query);
  return students.filter(student => (status === 'ALL' || student.status === status) && normalize(student.name).includes(needle));
}
