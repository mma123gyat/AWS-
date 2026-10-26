import { useFetch } from './useFetch'
import { getStudentDashboard } from '../api/studentApi'

export function useStudentDashboard() {
  const { state, refetch } = useFetch(getStudentDashboard)
  return { ...state, refetch }
}
