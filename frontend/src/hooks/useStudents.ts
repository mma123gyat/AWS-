import { toStudent } from '../api/mappers/studentMapper';
import { getStudents } from '../api/teacherApi';
import { useFetch } from './useFetch';

const fetchStudents = () => getStudents().then(list => list.map(toStudent));

export function useStudents() {
  return useFetch(fetchStudents).state;
}
