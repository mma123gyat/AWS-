import { useCallback, useState } from 'react'
import { useFetch } from './useFetch'
import { getStudentDashboard } from '../api/studentApi'

export function useStudentDashboard() {
  const [version, setVersion] = useState(0)

  const state = useFetch(() => getStudentDashboard(), [version])

  const refetch = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  return { ...state, refetch }
}
