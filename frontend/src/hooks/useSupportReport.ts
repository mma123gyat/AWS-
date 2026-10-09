import { getSupportReport } from '../api/supportApi';
import type { ApiSupportReport } from '../types/api';
import { useFetch } from './useFetch';

export function useSupportReport() {
  return useFetch<ApiSupportReport>(() => getSupportReport(), []);
}
