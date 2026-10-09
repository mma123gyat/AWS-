import { getParentDashboard } from '../api/parentApi';
import type { ApiParentDashboard } from '../types/api';
import { useFetch } from './useFetch';

export function useParentDashboard() {
  return useFetch<ApiParentDashboard>(() => getParentDashboard(), []);
}
